from pathlib import Path
from utils.csv.write_to_csv import write_to_csv


def test_write_to_csv(tmp_path: Path):
    EXPECTED_CONTENT = """response,worker
888,test456
"""

    file_path = tmp_path / "test.csv"

    write_to_csv(file_path, {
        "response": 888,
        "worker": "test456",
    })

    assert EXPECTED_CONTENT == file_path.read_text()


def test_write_to_csv_multiple_rows(tmp_path: Path):
    EXPECTED_CONTENT = """response,worker
999,test123
888,test456
"""

    file_path = tmp_path / "test.csv"

    write_to_csv(
        file_path,
        [{
            "response": 999,
            "worker": "test123",
        }, {
            "response": 888,
            "worker": "test456",
        }]
    )

    assert EXPECTED_CONTENT == file_path.read_text()


def test_write_to_csv_different_key_ordering(tmp_path: Path):
    EXPECTED_CONTENT = """worker,response
test456,888
"""

    file_path = tmp_path / "test.csv"

    write_to_csv(file_path, {"worker": "test456", "response": 888})

    assert EXPECTED_CONTENT == file_path.read_text()
