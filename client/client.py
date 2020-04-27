from flask import Flask, request, jsonify
from flask.logging import create_logger
from flask_cors import CORS
from importlib import import_module
import sys
import os
from os.path import dirname, abspath
import pprint
import inspect
import logging

tasks_folder_path = './tasks'

sys.path.insert(0, dirname(dirname(abspath(__file__))))

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.DEBUG)
logger = create_logger(app)


@app.route('/', methods=['POST'])
def task():
  if not request.is_json:
    return 'Body must be set and in JSON', 400

  body = request.get_json()
  logger.info('Inbound message: ' + pprint.pformat(body))

  if 'task' not in body:
    return 'Key "task" is missing from request', 400

  if 'fn' not in body:
    return 'Key "fn" is missing from request', 400

  task_name = body['task']
  try:
    task = import_module('tasks.' + str(task_name) + '.task')
  except ImportError:
    return 'No task named ' + '"' + str(task_name) + '"', 404

  if not hasattr(task, 'Task'):
    return 'Task "' + task_name + '" is missing the class "Task"'

  Task = getattr(task, 'Task')

  if 'dev' in body:
    task_instance = Task(body['dev'])
  else:
    task_instance = Task()

  fn = body['fn']
  if not hasattr(task_instance, fn):
    return 'Function "' + str(fn) + '" is not found for task "' + task_name + '"', 404

  fn_argspec = inspect.getargspec(getattr(task_instance, fn))
  full_actual_args = set(fn_argspec[0][1:])

  kwargs = body['kwargs'] if 'kwargs' in body else {}
  if type(kwargs) != dict:
    return 'Expected "kwargs" to be a dictionary (key/value pair)', 400

  passed_args = kwargs.keys()
  required_args = set(fn_argspec[0][1:len(fn_argspec[0]) -
                                    len(fn_argspec[3])]) if fn_argspec[3] else full_actual_args
  extra_args = ['"' + arg + '"' for arg in passed_args
                if arg not in full_actual_args] if not fn_argspec[2] else []
  missing_args = ['"' + arg + '"' for arg in required_args if arg not in passed_args]

  if len(extra_args) > 0 or len(missing_args) > 0:
    msgs = []
    if len(extra_args) > 0:
      msgs.append('including extra "kwargs": ' + ', '.join(extra_args))
    if len(missing_args) > 0:
      msgs.append('missing "kwargs": ' + ', '.join(missing_args))
    return 'Expecting minimum following "kwargs": ' + ', '.join(
        '"' + arg + '"'
        for arg in required_args) + '\nFn "' + fn + '" is ' + '; and '.join(msgs), 400

  outbound_message = getattr(task_instance, fn)(**kwargs)
  logger.info('Outbound message: ' + pprint.pformat(outbound_message))
  return jsonify(outbound_message)


@app.route('/jspsych-plugins', methods=['GET'])
def get_jspsych_plugins_list():
  dirname = os.path.dirname(__file__)
  default_jspsych_plugins_folder = os.path.join(dirname, '../lib/jspsych-6.1.0/plugins')
  plugins = [file for file in os.listdir(default_jspsych_plugins_folder) if file.endswith('.js')]
  return jsonify(plugins)
