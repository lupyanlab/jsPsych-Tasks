from __future__ import annotations
import os
from importlib import import_module
import socket
from waitress import serve
from task_runner.app import app
from task_runner.logger import logger
import task_runner.routes  # pylint: disable=unused-import
from task_runner.args import task_name, reload_enabled
from utils.remove_files import remove_files
from utils.paths.create_join_paths_function_with_base_path_check import (
    create_join_paths_function_with_base_path_check
)

PORT_RANGE = [7100, 7199]


# pylint: disable=redefined-outer-name
def next_free_port(allocated_task_ports: set[int]) -> int:
    """
    Based on the following but with allocated_task_ports that are already allocated.
    https://stackoverflow.com/a/57086072/8109319

    Allocated ports are not necessarily being used at the moment. They are simply
    ports that have been assigned to the tasks.
    """
    port, max_port = PORT_RANGE
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    while port <= max_port:
        try:
            if port not in allocated_task_ports:
                sock.bind(('', port))
                sock.close()
                return port
        finally:
            port += 1
    raise IOError('no free ports')


def get_allocated_task_ports() -> set[int]:
    """
    Returns the set of ports that have been allocated for existing tasks.
    If a port is None, then it treats that the task as unactive.
    """
    allocated_ports = set()
    tasks = os.listdir('tasks')
    for task in tasks:
        try:
            port_module = import_module(f'tasks.{task}.port')
            if not hasattr(port_module, 'PORT'):
                raise Exception(f'Task "{task}" is missing the PORT variable')
            port = getattr(port_module, 'PORT')
            if port is not None:
                allocated_ports.add(port)
        except Exception as e:
            raise Exception(f"Unable to parse port.py for task '{task}'") from e
    return allocated_ports


# pylint: enable=redefined-outer-name

if __name__ == "__main__":
    allocated_task_ports = get_allocated_task_ports()
    port = next_free_port(allocated_task_ports)
    create_join_paths_function_with_base_path_check(os.getcwd())
    remove_files(f"tasks/{task_name}/port.js")

    # Setting the app to serve single threaded because it will entirely
    # avoid the problems of multi-threading dealing
    # with file writes and reads that may interfere with one another
    # if not properly using a file lock. If multi-threading is
    # something to aim for in the future, then switching from files
    # to a network database should be the first step to take because it will
    # allow transaction locks and get the most out of peformance of reads and writes.

    if reload_enabled:
        logger.info("App reload is enabled.")
        # Reload
        app.run(debug=True, port=port, threaded=False)
    else:
        serve(app, host="0.0.0.0", port=port, threads=1)
