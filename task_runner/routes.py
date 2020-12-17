from inspect import signature, ismethod, Parameter
import os
from importlib import import_module
from flask import request, jsonify
from task_runner.app import app
from task_runner.args import task_name

tasks_folder_path = './tasks'

NEW_LINE = "\n"


@app.route('/', methods=['POST'])
def task():  # pylint: disable=too-many-return-statements
    if not request.is_json:
        return 'Body must be set and in JSON', 400

    body = request.get_json()

    if 'task' not in body:
        return 'Key "task" is missing from request', 400

    if 'fn' not in body:
        return 'Key "fn" is missing from request', 400

    if body["fn"].startswith("_"):
        return "Key 'fn' must not start with an underscore ('_')."

    kwargs = body['kwargs'] if 'kwargs' in body else {}
    if not isinstance(kwargs, dict):
        return 'Expected "kwargs" to be a dictionary (key/value pair)', 400
    passed_args = kwargs.keys()

    try:
        task_module = import_module(f"tasks.{task_name}.task")
    except ImportError:
        return f"No task named '{task_name}'", 404

    if not hasattr(task_module, 'Task'):
        return f"Task '{task_name}' is missing the class 'Task'", 500

    Task = getattr(task_module, 'Task')

    if 'dev' in body:
        task_instance = Task(body['dev'])
    else:
        task_instance = Task()

    fn_name = body['fn']
    if not hasattr(task_instance, fn_name):
        return f"Function '{fn_name}' is not found for task '{task_name}'", 404

    fn = getattr(task_instance, fn_name)
    if not ismethod(fn):
        return f"Function '{fn_name}' is not found for task '{task_name}'", 404

    parameters_map = signature(fn).parameters
    extra_args = [f"'{arg}'" for arg in passed_args if arg not in parameters_map or arg == "self"]
    missing_args = [
        f"'{p}'" for p in parameters_map.values()
        if p.name != "self" and p.default == Parameter.empty and p.name not in passed_args
    ]

    if len(extra_args) > 0 or len(missing_args) > 0:
        msgs = []
        if len(extra_args) > 0:
            msgs.append(f"Included extra 'kwargs': {', '.join(extra_args)}")
        if len(missing_args) > 0:
            msgs.append(f"Missed 'kwargs': {', '.join(missing_args)}")
        return (
            f"Request body for function '{fn_name}' has the following issues: "
            "\n".join(msgs) + "Expected minimum following 'kwargs': " + '\n'.join(
                f"'{p.name}" for p in parameters_map.values()
                if p.name != "self" and p.default == Parameter.empty
            )
        ), 400

    outbound_message = fn(**kwargs)
    return jsonify(outbound_message)


@app.route('/jspsych-plugins', methods=['GET'])
def get_jspsych_plugins_list():
    dirname = os.path.dirname(__file__)
    default_jspsych_plugins_folder = os.path.join(dirname, '../lib/jspsych-6.1.0/plugins')
    plugins = [file for file in os.listdir(default_jspsych_plugins_folder) if file.endswith('.js')]
    return jsonify(plugins)
