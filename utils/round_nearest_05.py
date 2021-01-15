def round_nearest_05(x: float) -> float:
    """
    Rounds to nearest 0.05. This is optimized to produce accurate precision

    Round down:
    round_nearest_05(1.25) == 1.25
    round_nearest_05(1.27) == 1.25

    Round up:
    round_nearest_05(1.275) == 1.30
    round_nearest_05(1.28) == 1.30

    (see test file test_round_nearest_05.py for more examples).

    Parameters:
    x: Number to be rounded to nearest 0.05
    """
    temp = 0.05
    i = 0
    while temp < 1:
        x *= 10
        temp *= 10
        i += 1

    return (round(x / temp) * temp) / (100)
