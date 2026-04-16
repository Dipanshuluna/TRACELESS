from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone


def main() -> None:
    base_path = sys.argv[1]
    output = []
    for entry in sorted(os.scandir(base_path), key=lambda item: item.name.lower()):
        if not entry.is_file():
            continue
        stat = entry.stat()
        output.append(
            {
                "name": entry.name,
                "path": entry.name,
                "size_bytes": stat.st_size,
                "modified_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
            }
        )
    print(json.dumps(output))


if __name__ == "__main__":
    main()

