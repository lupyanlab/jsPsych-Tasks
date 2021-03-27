from importlib import import_module
from inspect import Parameter, ismethod, signature

from flask import jsonify, request

from task_runner.app import app
from task_runner.logger import logger
from utils.constants import APP_TASK_NAME_KEY
from utils.paths.get_dirname import get_dirname

dirname = get_dirname(__file__)

NEW_LINE = "\n"


# Always log the error and respond with only the error message
@app.errorhandler(Exception)
def errorhandler(e):
    logger.exception(e)
    return f"Check exception: {e}", 500


@app.after_request
def after_request(response):
    if response.status_code != 200:
        logger.warning(response.data)
    return response


@app.route('/', methods=['POST'])
def task():  # pylint: disable=too-many-return-statements
    task_name = app.config[APP_TASK_NAME_KEY]

    if not request.is_json:
        return 'Body must be set and in JSON', 400

    body = request.get_json()

    if 'fn' not in body:
        return 'Key "fn" is missing from request', 400

    if body["fn"].startswith("_"):
        return "Key 'fn' must not start with an underscore ('_')."

    kwargs = body.get('kwargs', {})
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

    task_instance = Task(dev=body.get("dev"))

    fn_name = body['fn']
    logger.info("fn requested: %s", fn_name)
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
            "\n".join(msgs) + " Expected minimum following 'kwargs': [" + ','.join(
                f"'{p.name}" for p in parameters_map.values()
                if p.name != "self" and p.default == Parameter.empty
            ) + "]"
        ), 400

    if "worker_id" in body.get('kwargs', {}):
        logger.info("worker_id requested: %s", body["kwargs"]["worker_id"])

    outbound_message = fn(**kwargs)
    return jsonify(outbound_message)
