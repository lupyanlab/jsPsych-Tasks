from __future__ import annotations
from pathlib import Path


def listdir(path: Path) -> list[Path]:
    """
    Same as os.listdir except that hidden files (starting with a dot '.')
    are excluded.

    Parameters:
    path: Path to the directory

    Returns:
    List of files and directories in the path
    """

    return [item for item in path.iterdir() if not path.name.startswith('.')]
