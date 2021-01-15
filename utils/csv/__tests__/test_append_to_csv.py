from pathlib import Path
import pytest
from utils.csv.append_to_csv import append_to_csv


def test_append_to_csv(tmp_path: Path):
    CONTENT = """response,worker
999,test123
"""

    EXPECTED_CONTENT = """response,worker
999,test123
888,test456
"""

    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    append_to_csv(file_path, {"response": 888, "worker": "test456"})

    assert EXPECTED_CONTENT == file_path.read_text()


def test_append_to_csv_different_fields_order(tmp_path: Path):
    CONTENT = """worker,response
test123,999
"""

    EXPECTED_CONTENT = """worker,response
test123,999
test456,888
"""

    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    append_to_csv(file_path, {"worker": "test456", "response": 888})

    assert EXPECTED_CONTENT == file_path.read_text()


def test_append_to_csv_nonexistent_file_path(tmp_path: Path):
    EXPECTED_CONTENT = """worker,response
test456,888
"""

    file_path = tmp_path / "test.csv"

    append_to_csv(file_path, {"worker": "test456", "response": 888})

    assert EXPECTED_CONTENT == file_path.read_text()


def test_append_to_csv_missing_field(tmp_path: Path):
    CONTENT = """response,worker
999,test123
"""

    EXPECTED_CONTENT = """response,worker
999,test123
,test456
"""

    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    append_to_csv(file_path, {"worker": "test456"})

    assert EXPECTED_CONTENT == file_path.read_text()


def test_append_to_csv_extra_field(tmp_path: Path):
    CONTENT = """response,worker
999,test123
"""

    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    with pytest.raises(ValueError) as exc:
        append_to_csv(file_path, {"worker": "test456", "response": 888, "extra": "other"})

    assert exc.value.args[0] == "dict contains fields not in fieldnames: 'extra'"


def test_append_to_csv_multiple_fields(tmp_path: Path):
    CONTENT = """response,worker
999,test123
"""

    EXPECTED_CONTENT = """response,worker
999,test123
888,test456
777,test789
"""

    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    append_to_csv(
        file_path,
        [{
            "response": 888,
            "worker": "test456",
        }, {
            "response": 777,
            "worker": "test789",
        }]
    )

    assert EXPECTED_CONTENT == file_path.read_text()
