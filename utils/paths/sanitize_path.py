from __future__ import annotations
import os
import urllib


def sanitize_path(path: str) -> str:
    """
    Sanitizes path to be absolute and normalized.

    Parameters:
    path: Unsanitized path

	Returns:
	Sanitized path
	"""
    path = urllib.parse.unquote(path)
    path = os.path.normpath(os.path.normcase(path))
    path = os.path.abspath(path)
    path = os.path.realpath(path)

    return path
