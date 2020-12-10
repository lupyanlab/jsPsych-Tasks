from __future__ import annotations
import argparse
import os
from importlib import import_module
import socket
from waitress import serve
from utils.remove_files import remove_files
from task_runner.app import app

PORT_RANGE = [7100, 7199]

parser = argparse.ArgumentParser(description="This script runs a task server.")
parser.add_argument('task', help='task folder name')
parser.add_argument('--reload', default=False, help='enables server to reload on file changes')

args = parser.parse_args()
task_name = args.task


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


if __name__ == "__main__":
    allocated_task_ports = get_allocated_task_ports()
    port = next_free_port(allocated_task_ports)
    remove_files(f"tasks/{task_name}/")

    # Reload
    # app.run(debug=True)
    serve(app, host="0.0.0.0", port=port)
