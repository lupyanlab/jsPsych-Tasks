from __future__ import annotations
from utils.paths.sanitize_path import sanitize_path


def join_paths(*paths: list[str]) -> str:
    """
    Joins the paths and sanitize full path

    Parameters:
    *paths: unsanitized paths to join

	Returns:
	Canonical (absolute) sanitized path.
	"""
    full_path = '/'.join(paths)
    full_path = sanitize_path(full_path)

    return full_path
