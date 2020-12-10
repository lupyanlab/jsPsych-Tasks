from __future__ import annotations
from typing import Callable
from utils.paths.join_paths import join_paths


def create_join_paths_function_with_base_path_check_strings(base_path: str
                                                            ) -> Callable[[list[str]], str]:
    """
    NOTE:
    This is the string version of the related module create_join_paths_function_with_base_path_check.
    The other module uses the standard pathlib module.

    Creates a join_paths function that will prepend the base_path to the resulting joined path
    and include a check to make sure that the resulting path is under that base_path.
    (Catches inadvertent relative path traversals which have ../ in their paths.)

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
        full_path = join_paths(base_path, *paths)
        safe = full_path.startswith(base_path)
        if not safe:
            raise Exception(
                f"Joined path {full_path} is not a path under the base path {base_path}"
            )

        return full_path

    return join_paths_with_check
