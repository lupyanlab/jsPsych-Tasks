from random_username.generate import generate_username


def get_random_username() -> str:
    """
	Generates a random username

	Returns:
	A random username
	"""

    return generate_username(1)[0]
