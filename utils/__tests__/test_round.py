from ..round import round_nearest_05


def test_round_nearest_05():
  assert round_nearest_05(0) == 0
  assert round_nearest_05(0.05) == 0.05
  assert round_nearest_05(1.25) == 1.25
  assert round_nearest_05(1.251) == 1.25
  assert round_nearest_05(1.27) == 1.25
  assert round_nearest_05(1.275) == 1.30
  assert round_nearest_05(1.28) == 1.30
  assert round_nearest_05(1.30) == 1.30
  assert round_nearest_05(0.3) == 0.3
  assert round_nearest_05(0.6) == 0.6
