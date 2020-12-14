from pathlib import Path


def get_dirname(file_path: str) -> Path:
    """
    Returns the directory canonical path of the file.

    Example:
    dirname = get_dirname(__file__)

    Parameters:
    file_path: File path
    """

    return Path(file_path).resolve().parent
