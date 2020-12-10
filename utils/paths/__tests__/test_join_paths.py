from utils.paths.join_paths import join_paths


def test_join_paths():
    assert join_paths("/foo", "bar", "test") == "/foo/bar/test"
    assert join_paths("/foo/", "/bar/", "/test/") == "/foo/bar/test"
