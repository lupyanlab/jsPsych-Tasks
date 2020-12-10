from __future__ import annotations
from typing import Callable
from pathlib import Path
from functools import reduce


class SamePathAsBasePathError(Exception):
    """
    Error for when the resulting path is in the same path as the result path.
    The result path should be strictly under the base path.
    """
    path: Path
    base_path: Path

    def __init__(self, path: Path, base_path: Path):
        message = (
            f"The resulting joined path '{path}' is exactly the same path as the "
            f"base path '{base_path}'. It should be strictly under the base path and not the same."
        )
        self.path = path
        self.base_path = base_path

        super().__init__(message)


class PathNotUnderBasePathError(Exception):
    """
    Error for when the resulting path is not under the result path.
    The result path should be under the base path.
    """
    path: Path
    base_path: Path

    def __init__(self, path: Path, base_path: Path):
        message = (
            f"The resulting joined path '{path}' is not a path under the "
            f"base path '{base_path}'. It should be under the base path."
        )
        self.path = path
        self.base_path = base_path

        super().__init__(message)


def create_join_paths_function_with_base_path_check(base_path: Path
                                                    ) -> Callable[[list[Path]], Path]:
    """
    Creates a join_paths function that will prepend the base_path to the resulting joined path
    and include a check to make sure that the resulting path is under that base_path.
    (Catches inadvertent relative path traversals which have ../ in their paths.)

    NOTE: Please do not include any slashes! The module pathlib will interpret
    leading slashes as a start of a new absolute path. This will likely be caught
    to be a path that's not under the base path anyway so this is less of a worry.

    Example:
    worker_id = testWorker123
    join_paths = create_join_paths_function_with_base_path_check(
		'/var/www/mturk/sandbox/tasks/TaskName/dev/trials'
	)
    file_path = join_paths(worker_id)
	# file_path == "/var/www/mturk/sandbox/tasks/TaskName/dev/trials/testWorker123"
    Parameters:
    base_path: base path to assert the resulting path to be in

    Returns:
    A function similar to join_paths but with the additional check that will
    raise an exception if the output is not under the base path.
	"""
    def join_paths_with_check(*paths: list[str]) -> str:
        full_path = reduce(lambda acc, path: acc / path, paths, base_path).resolve()

        if base_path == full_path:
            raise SamePathAsBasePathError(full_path, base_path)
        if base_path not in full_path.parents:
            raise PathNotUnderBasePathError(full_path, base_path)

        return full_path

    return join_paths_with_check
