from utils.paths.create_join_paths_function_with_base_path_check import (
    create_join_paths_function_with_base_path_check
)


def test_create_join_paths_function_with_base_path_check():
    worker_id = "testWorker123"
    join_paths = create_join_paths_function_with_base_path_check(
        '/var/www/mturk/sandbox/tasks/TaskName/dev/trials'
    )
    assert join_paths(
        worker_id
    ) == "/var/www/mturk/sandbox/tasks/TaskName/dev/trials/testWorker123"
