def round_nearest_05(x):
  '''
  Rounds to nearest 0.05. This is optimized to produce accurate precision (see test file).
  '''
  temp = 0.05
  i = 0
  while temp < 1:
    x *= 10
    temp *= 10
    i += 1

  return (round(x / temp) * temp) / (100)
