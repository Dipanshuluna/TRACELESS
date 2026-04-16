from app.utils.port_allocator import PortAllocator


def test_allocate_returns_integer():
    port = PortAllocator.allocate(17000, set())
    assert isinstance(port, int)
    assert port >= 17000

