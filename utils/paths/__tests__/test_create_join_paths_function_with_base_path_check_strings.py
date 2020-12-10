import pytest
from utils.paths.create_join_paths_function_with_base_path_check_strings import (
    create_join_paths_function_with_base_path_check_strings
)


def test_create_join_paths_function_with_base_path_check_strings():
    base_path = "/foo"
    join_paths = create_join_paths_function_with_base_path_check_strings(base_path)
    assert join_paths("bar", "test") == "/foo/bar/test"
    with pytest.raises(Exception, match=r".* base path .*"):
        join_paths("/bar", "test")
    with pytest.raises(Exception, match=r".* base path .*"):
        join_paths("/foo", "..", "test")
    with pytest.raises(Exception, match=r".* base path .*"):
        join_paths("/foo", "../test")
