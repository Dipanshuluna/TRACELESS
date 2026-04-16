from __future__ import annotations

import io
import shlex
import tarfile
import time
import urllib.request
from datetime import datetime, timezone
from typing import Iterator

import docker
from docker.errors import DockerException, NotFound
from docker.models.containers import Container


class DockerGateway:
    def __init__(self) -> None:
        self.client = docker.from_env()

    def get_container_by_name(self, container_name: str) -> Container:
        return self.client.containers.get(container_name)

    def inspect_container(self, container_id: str) -> Container:
        return self.client.containers.get(container_id)

    def remove_container(self, container_id: str) -> None:
        container = self.inspect_container(container_id)
        container.remove(force=True)

    def restart_container(self, container_id: str) -> None:
        container = self.inspect_container(container_id)
        container.restart(timeout=10)

    def wait_for_running(self, container_id: str, timeout_seconds: int = 30) -> Container:
        deadline = time.monotonic() + timeout_seconds
        while time.monotonic() < deadline:
            container = self.inspect_container(container_id)
            container.reload()
            if container.status == "running":
                return container
            time.sleep(1)
        raise RuntimeError("container did not return to running state in time")

    def exec_shell(self, container_id: str, command: str) -> bytes:
        container = self.inspect_container(container_id)
        result = container.exec_run(["sh", "-lc", command])
        if result.exit_code != 0:
            raise RuntimeError(result.output.decode("utf-8", errors="ignore"))
        return result.output

    def reset_paths(self, container_id: str, paths: tuple[str, ...]) -> None:
        quoted_paths = " ".join(shlex.quote(path) for path in paths)
        command = f"""
for path in {quoted_paths}; do
  mkdir -p "$path"
  find "$path" -mindepth 1 -exec rm -rf -- {{}} +
done
"""
        self.exec_shell(container_id, command)

    def is_directory_empty(self, container_id: str, path: str) -> bool:
        command = f"""
mkdir -p {shlex.quote(path)}
if find {shlex.quote(path)} -mindepth 1 -print -quit | grep -q .; then
  echo no
else
  echo yes
fi
"""
        output = self.exec_shell(container_id, command).decode("utf-8", errors="ignore").strip()
        return output == "yes"

    @staticmethod
    def probe_http(url: str, timeout_seconds: int = 3) -> bool:
        try:
            with urllib.request.urlopen(url, timeout=timeout_seconds) as response:
                return 200 <= response.status < 500
        except Exception:
            return False

    def read_file_archive(self, container_id: str, path: str) -> bytes:
        container = self.inspect_container(container_id)
        stream, _ = container.get_archive(path)
        return b"".join(stream)

    def list_directory(self, container_id: str, path: str) -> list[dict]:
        archive = self.read_file_archive(container_id, path)
        tar_buffer = io.BytesIO(archive)
        entries: list[dict] = []
        root_name: str | None = None

        with tarfile.open(fileobj=tar_buffer) as tar:
            for member in tar.getmembers():
                parts = member.name.split("/")
                if root_name is None and parts:
                    root_name = parts[0]

                if not member.isfile():
                    continue
                if len(parts) < 2:
                    continue
                if root_name is not None and parts[0] != root_name:
                    continue

                relative_path = "/".join(parts[1:])
                entries.append(
                    {
                        "name": parts[-1],
                        "path": relative_path,
                        "size_bytes": member.size,
                        "modified_at": datetime.fromtimestamp(
                            member.mtime, tz=timezone.utc
                        ).isoformat(),
                    }
                )

        return sorted(entries, key=lambda item: item["name"].lower())

    def stream_file_bytes(self, container_id: str, path: str) -> tuple[Iterator[bytes], int]:
        archive = self.read_file_archive(container_id, path)
        tar_buffer = io.BytesIO(archive)
        with tarfile.open(fileobj=tar_buffer) as tar:
            members = [member for member in tar.getmembers() if member.isfile()]
            if not members:
                raise FileNotFoundError(path)
            extracted = tar.extractfile(members[0])
            if extracted is None:
                raise FileNotFoundError(path)
            data = extracted.read()
        return iter([data]), len(data)

    def ping(self) -> bool:
        try:
            return bool(self.client.ping())
        except DockerException:
            return False
