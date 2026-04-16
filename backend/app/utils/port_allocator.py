import socket


class PortAllocator:
    @staticmethod
    def allocate(start_port: int, reserved_ports: set[int]) -> int:
        port = start_port
        while port < start_port + 5000:
            if port not in reserved_ports and PortAllocator._is_available(port):
                return port
            port += 1
        raise RuntimeError("no available port found for browser session")

    @staticmethod
    def _is_available(port: int) -> bool:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            return sock.connect_ex(("127.0.0.1", port)) != 0

