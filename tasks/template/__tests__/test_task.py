from random import seed
from shutil import rmtree

import task_runner.routes  # pylint: disable=unused-import
from task_runner.app import app
from utils.constants import APP_TASK_NAME_KEY
from utils.paths.get_dirname import get_dirname

dirname = get_dirname(__file__)
task_folder_path = dirname.parent
task_name = task_folder_path.name

app.config[APP_TASK_NAME_KEY] = task_name
client = app.test_client()


def test_trials(snapshot):
    seed(0)
    worker_id = "test_worker_pytest"
    test_folder_path = task_folder_path / "test"
    if test_folder_path.exists():
        rmtree(test_folder_path)

    response = client.post(
        "/", json={
            "fn": "trials",
            "test": True,
            "kwargs": {
                "worker_id": worker_id,
            }
        }
    )

    assert response.status_code == 200, f"Code {response.status_code}: {response.data}"
    snapshot.assert_match(response.get_json())

    trial_file_path = test_folder_path / "trials" / f"{worker_id}.csv"
    snapshot.assert_match(trial_file_path.read_text())

    counts_file_path = test_folder_path / "counts.csv"
    snapshot.assert_match(counts_file_path.read_text())
