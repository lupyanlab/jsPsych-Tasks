from utils.paths.sanitize_path import sanitize_path


def test_sanitize_path():
    assert sanitize_path("/foo/../foo") == "/foo"
