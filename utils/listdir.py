from __future__ import annotations
from pathlib import Path


def listdir(directory_path: Path) -> list[Path]:
    """
    Same as os.listdir except that hidden files (starting with a dot '.')
    are excluded.

    Parameters:
    directory_path: Path to the directory

    Returns:
    List of files and directories in the path
    """

    return [item for item in directory_path.iterdir() if not item.name.startswith('.')]
