from __future__ import annotations
from typing import Union
from pathlib import Path
from functools import reduce
from utils.mkdir import mkdir as mkdir_fn
from utils.remove_files import remove_files


class SamePathAsBasePathError(Exception):
    """
    Error for when the resulting path is in the same path as the result path.
    The result path should be strictly under the base path.
    """
    path: Path
    base_path: Path
    input_paths: list[Path]

    def __init__(self, path: Path, base_path: Path, input_paths: list[Path]):
        message = (
            f"The resulting joined path '{path}' is exactly the same path as the "
            f"base path '{base_path}'. It should be strictly under the base path and not the same. "
            f"The input was {input_paths}"
        )
        self.path = path
        self.base_path = base_path
        self.input_paths = input_paths

        super().__init__(message)


class PathNotUnderBasePathError(Exception):
    """
    Error for when the resulting path is not under the result path.
    The result path should be under the base path.
    """
    path: Path
    base_path: Path
    input_paths: list[Path]

    def __init__(self, path: Path, base_path: Path, input_paths: list[Path]):
        message = (
            f"The resulting joined path '{path}' is not a path under the "
            f"base path '{base_path}'. It should be under the base path."
            f"The input path was {input_paths}"
        )
        self.path = path
        self.base_path = base_path
        self.input_paths = input_paths

        super().__init__(message)


def create_join_paths_fn(base_path: Path,
                         mkdir=False) -> callable[[list[Union[Path, str]], bool, bool], Path]:
    """
    Creates a join_paths function that will prepend the base_path to the resulting joined path
    and include a check to make sure that the resulting path is under that base_path.
    (Catches inadvertent relative path traversals which have ../ in their paths.)

    NOTE: Please do not include any slashes! The module pathlib will interpret
    leading slashes as a start of a new absolute path. This will likely be caught
    to be a path that's not under the base path anyway so this is less of a worry.

    Example:
    worker_id = testWorker123
    join_paths = create_join_paths_fn(
		'/var/www/mturk/sandbox/tasks/TaskName/dev/trials'
	)
    file_path = join_paths(worker_id)
	# file_path == "/var/www/mturk/sandbox/tasks/TaskName/dev/trials/testWorker123"

    Parameters:
    base_path: Base path to assert the resulting path to be in
    mkdir: Create the base path folder

    Returns:
    A function similar to join_paths but with the additional check that will
    raise an exception if the output is not under the base path.
	"""
    if mkdir:
        mkdir_fn(base_path)

    def join_paths_with_check(
        *paths: list[Union[Path, str]], mkdir: bool = False, rm: bool = False
    ) -> Path:
        """
        Parameters:
        *paths: Paths to join
        mkdir: Create the folder (if path is a folder) if it doesn't exist.
               Doesn't create the parent folders.
        rm: Remove the file (if path is a file) if it exists.

        Returns:
        The joined path
        """
        full_path = reduce(lambda acc, path: acc / path, paths, base_path).resolve()

        if base_path == full_path:
            raise SamePathAsBasePathError(full_path, base_path, paths)
        if base_path not in full_path.parents:
            raise PathNotUnderBasePathError(full_path, base_path, paths)

        if mkdir:
            mkdir_fn(full_path)

        if rm:
            remove_files(full_path)

        return full_path

    return join_paths_with_check
