import csv
from pathlib import Path

from utils.csv.parse_str_list import parse_str_list


def test_parse_str_list(tmp_path: Path):
    test_file_path = tmp_path / "test.csv"
    with open(test_file_path, 'w') as f:
        w = csv.DictWriter(f, ["c"])
        w.writeheader()
        # Cannot parse booleans from Python because of capitalization
        # w.writerow({"bar": [1, "foo", True]})
        w.writerow({"c": [1, 2, "foo", "bar"]})

    row = None
    with open(test_file_path, 'r') as f:
        r = csv.DictReader(f, ["c"])
        for r_tmp in r:
            row = r_tmp

    assert [1, 2, 'foo', 'bar'] == parse_str_list(row["c"])
