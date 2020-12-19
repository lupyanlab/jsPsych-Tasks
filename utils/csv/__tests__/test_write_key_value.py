from pathlib import Path

from utils.csv.write_key_value import write_key_value


def test_write_to_csv(tmp_path: Path):
    EXPECTED_CONTENT = """key,value
worker,test456
response,888
"""

    file_path = tmp_path / "test.csv"

    write_key_value(file_path, {
        "worker": "test456",
        "response": 888,
    })

    assert EXPECTED_CONTENT == file_path.read_text()
