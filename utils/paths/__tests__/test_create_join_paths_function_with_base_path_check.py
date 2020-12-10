from pathlib import Path
import pytest
from utils.paths.create_join_paths_function_with_base_path_check import (
    create_join_paths_function_with_base_path_check,
    SamePathAsBasePathError,
    PathNotUnderBasePathError,
)


def test_create_join_paths_function_with_base_path_check():
    base_path = Path("/foo")
    join_paths = create_join_paths_function_with_base_path_check(base_path)

    assert join_paths("test.py") == Path("/foo/test.py")
    assert join_paths("bar", "test.py") == Path("/foo/bar/test.py")

    with pytest.raises(SamePathAsBasePathError) as exc:
        join_paths("test", "..")
    assert exc.value.path == Path("/foo")
    assert exc.value.base_path == Path("/foo")

    with pytest.raises(PathNotUnderBasePathError) as exc:
        join_paths("/bar", "test")
    assert exc.value.path == Path("/bar/test")
    assert exc.value.base_path == Path("/foo")

    with pytest.raises(PathNotUnderBasePathError) as exc:
        join_paths("..", "test")
    assert exc.value.path == Path("/test")
    assert exc.value.base_path == Path("/foo")

    with pytest.raises(PathNotUnderBasePathError) as exc:
        join_paths("../test")
    assert exc.value.path == Path("/test")
    assert exc.value.base_path == Path("/foo")
