from typing import List
import os
from pathlib import Path


def remove_files(*file_paths: List[Path]) -> None:
    """
    Remove files if they exist.

    Parameters:
    *file_paths: File paths with files to delete
    """
    for file_path in file_paths:
        if os.path.exists(file_path):
            os.remove(file_path)
