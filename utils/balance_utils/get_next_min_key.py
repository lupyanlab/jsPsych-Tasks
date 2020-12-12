from utils.balance_utils.get_next_min_keys import get_next_min_keys


def get_next_min_key(counts_file_path: str, write=True) -> str:
    """
    Get the next key with the lowest count.

    Parameters:
    counts_file_path: File path for counts file
    keys: Keys

    Returns:
    Lowest count key
    """
    return get_next_min_keys(counts_file_path, 1, write)[0]
