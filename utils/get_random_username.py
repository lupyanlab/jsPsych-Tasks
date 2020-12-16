from time import time
from random_username.generate import generate_username


def get_random_username() -> str:
    """
	Generates a random username with the seconds since the epoch
	appended at the end.

	Returns:
	A random username
	"""

    return f"{generate_username(1)[0]}_{int(time())}"
