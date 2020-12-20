import functools

from flask import Flask
from flask._compat import reraise
from flask_cors import CORS


def my_log_exception(exc_info, original_log_exception=None):
    original_log_exception(exc_info)
    exc_type, exc, tb = exc_info
    # re-raise for werkzeug
    reraise(exc_type, exc, tb)


app = Flask(__name__)
app.log_exception = functools.partial(my_log_exception, original_log_exception=app.log_exception)

CORS(app)
