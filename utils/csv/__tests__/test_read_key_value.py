from pathlib import Path
from utils.csv.read_key_value import read_key_value


def test_read_key_value(tmp_path: Path):
    CONTENT = """key,value
test123,999
test456,888
"""

    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    assert {"test123": "999", "test456": "888"} == read_key_value(file_path)


def test_append_to_csv_empty(tmp_path: Path):
    CONTENT = """key,value
"""

    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    assert {} == read_key_value(file_path)


def test_read_key_value_empty(tmp_path: Path):
    CONTENT = """key,value
test123,
,888
"""

    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    assert {"test123": None, "": "888"} == read_key_value(file_path)


def test_read_key_value_key_collision(tmp_path: Path):
    CONTENT = """key,value
test123,999
test123,888
"""

    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    assert {"test123": "888"} == read_key_value(file_path)
