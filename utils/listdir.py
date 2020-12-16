from __future__ import annotations
import os
from typing import Union
from pathlib import Path


def listdir(path: Union[Path, str]) -> list[str]:
    """
    Same as os.listdir except that hidden files (starting with a dot '.')
    are excluded.

    Parameters:
    path: Path to the directory

    Returns:
    List of files and directories in the path
    """

    return [item for item in os.listdir(path) if not item.startswith('.')]
