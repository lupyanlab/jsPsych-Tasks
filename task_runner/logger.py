from flask.logging import create_logger
import logging
from task_runner.app import app

logging.basicConfig(level=logging.DEBUG)
logger = create_logger(app)
