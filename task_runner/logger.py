import logging
from flask.logging import create_logger
from task_runner.app import app
from task_runner.args import reload_enabled

logging.basicConfig(level=logging.INFO)
if reload_enabled:
    # logging.basicConfig(level=logging.DEBUG)
    logger = create_logger(app)
else:
    logger = logging.getLogger('waitress')
    logger.setLevel(logging.INFO)
