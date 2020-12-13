from pathlib import Path
from utils.csv.write_to_csv import write_to_csv


def test_write_to_csv(tmp_path: Path):
    EXPECTED_CONTENT = """worker,response
test123,1
"""
    file_path = tmp_path / "test.csv"
    write_to_csv(str(file_path), {"worker": "test123", "response": 1})

    assert EXPECTED_CONTENT == file_path.read_text()


def test_write_to_csv_multiple_fields(tmp_path: Path):
    EXPECTED_CONTENT = """worker,response
test123,1
test456,2
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
