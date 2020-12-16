from pathlib import Path


def mkdir(*paths: Path) -> None:
    """
    Create the folders with appropriate permissions and when thex exist.

    Parameters:
    *paths: The paths to create the folders.
    """

    for path in paths:
        path.mkdir(mode=0o775, exist_ok=True)
