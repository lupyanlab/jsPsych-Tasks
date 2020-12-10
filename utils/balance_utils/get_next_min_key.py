from threading import RLock
from utils.balance_utils.get_next_min_keys import get_next_min_keys


def get_next_min_key(update_file_lock: RLock, counts_file_path: str, write=True) -> str:
    """
    Get the next key with the lowest count.

    Parameters:
    update_file_lock: Lock for avoiding multiple reads/writes at same time
    counts_file_path: File path for counts file
    keys: Keys

    Returns:
    Lowest count key
    """
    return get_next_min_keys(update_file_lock, counts_file_path, 1, write)[0]
