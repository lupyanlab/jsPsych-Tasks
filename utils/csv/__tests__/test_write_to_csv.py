from pathlib import Path
import pytest
from utils.csv.write_to_csv import write_to_csv


def test_write_to_csv(tmp_path: Path):
    EXPECTED_CONTENT = """response,worker
1,test123
"""
    file_path = tmp_path / "test.csv"
    write_to_csv(str(file_path), {"worker": "test123", "response": 1})

    assert EXPECTED_CONTENT == file_path.read_text()


def test_write_to_csv_multiple_fields(tmp_path: Path):
    EXPECTED_CONTENT = """response,worker
1,test123
2,test456
"""
    file_path = tmp_path / "test.csv"
    write_to_csv(
        str(file_path),
        [{
            "worker": "test123",
            "response": 1
        }, {
            "worker": "test456",
            "response": 2
        }]
    )

    assert EXPECTED_CONTENT == file_path.read_text()


def test_write_to_csv_order(tmp_path: Path):
    EXPECTED_CONTENT = """worker,response
test123,1
"""
    file_path = tmp_path / "test.csv"
    write_to_csv(
        str(file_path), {
            "worker": "test123",
            "response": 1
        }, order=["worker", "response"]
    )

    assert EXPECTED_CONTENT == file_path.read_text()


def test_write_to_csv_bad_order(tmp_path: Path):
    file_path = tmp_path / "test.csv"

    with pytest.raises(ValueError) as exc:
        write_to_csv(str(file_path), {"worker": "test123", "response": 1}, order=["worker"])
    assert exc.value.args[0] == "dict contains fields not in fieldnames: 'response'"


def test_write_to_csv_missing_fields(tmp_path: Path):
    EXPECTED_CONTENT = """worker,response,nonexistent
test123,1,
"""

    file_path = tmp_path / "test.csv"
    write_to_csv(
        str(file_path), {
            "worker": "test123",
            "response": 1
        },
        order=["worker", "response", "nonexistent"]
    )

    assert EXPECTED_CONTENT == file_path.read_text()
