from flask.logging import create_logger
import logging
from .app import app

logging.basicConfig(level=logging.DEBUG)
logger = create_logger(app)
