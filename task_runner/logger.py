import logging
from flask.logging import create_logger
from task_runner.app import app

logging.basicConfig(level=logging.INFO)
logger = create_logger(app)
