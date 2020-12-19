from __future__ import annotations

import os
import socket
from importlib import import_module
from time import sleep, time

from paste.translogger import TransLogger
from waitress import serve

import task_runner.routes  # pylint: disable=unused-import
from task_runner.app import app
from task_runner.args import reload_enabled, task_name
from task_runner.logger import logger
from utils.constants import APP_TASK_NAME_KEY
from utils.paths.create_join_paths_fn import create_join_paths_fn
from utils.paths.get_dirname import get_dirname

PORT_RANGE = [7100, 7199]

dirname = get_dirname(__file__)


# pylint: disable=redefined-outer-name
def is_port_open(port: int, timeout=10) -> bool:
    """
    Checks if port is open given a timeout.

    Returns:
    True if port is open before timeout else False.
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    timeout_end = timeout + time()

    logger.info(f"Waiting for port {port} to open...")
    while time() < timeout_end:
        try:
            sock.bind(('', port))
            sock.close()
            logger.info(f"Port {port} opened!")
            return True
        except OSError as e:
            sleep(0.25)
    logger.info(f"Port {port} did open after {timeout} seconds. Looking for a different port...")
    return False


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
        except OSError:
            pass
        finally:
            port += 1
    raise IOError('no free ports')


def get_allocated_task_ports() -> set[int]:
    """
    Returns the set of ports that have been allocated for existing tasks.
    If a port is None, then it treats that the task as unactive.
    """
    allocated_ports = set()
    tasks = [
        item for item in (dirname / "tasks").iterdir()
        if item.is_dir() and item.name != "__pycache__" and item.name != task_name
    ]
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
    # Set if not in the flask reloading child
    # https://stackoverflow.com/questions/25504149/why-does-running-the-flask-dev-server-run-itself-twice
    port = None

    app.config[APP_TASK_NAME_KEY] = task_name

    is_reloading_child = os.environ.get("WERKZEUG_RUN_MAIN") == "true"
    logger.info("is_reloading_child=%s", is_reloading_child)
    # Only update port before debug mode has started or in production WSGI server
    if not is_reloading_child:
        join_paths = create_join_paths_fn(dirname)
        py_port_file_path = join_paths("tasks", task_name, "port.py", rm=False)

        # We need to use the same port because sometimes when restarting, the port
        # is still occupied for the next minute for some reason. Waitress serve
        # will always overwrite the port.
        if py_port_file_path.exists():
            port = getattr(import_module(f"tasks.{task_name}.port"), 'PORT')
            logger.info("Using existing port: %s", port)
        else:
            logger.info("looking for port")

            # if not existing_port_is_open:
            allocated_task_ports = get_allocated_task_ports()
            port = next_free_port(allocated_task_ports)

            py_port_file_path = join_paths("tasks", task_name, "port.py", rm=True)
            py_port_file_path.touch()
            py_port_file_path.write_text(f"PORT = {port}\n")

            js_port_file_path = join_paths("tasks", task_name, "port.js", rm=True)
            js_port_file_path.touch()
            js_port_file_path.write_text(f"export default {port};\n")

        logger.info("App is started.")
        logger.info(f"Listening on port {port}")

    # app.config["started"] = True
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
        logger.info("App reload is disabled.")
        serve(TransLogger(app), host="0.0.0.0", port=port, threads=1)
