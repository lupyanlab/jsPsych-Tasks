from random import seed

from unittest.mock import patch

import task_runner.routes  # pylint: disable=unused-import
from task_runner.app import app
from utils.constants import APP_TASK_NAME_KEY, ENV_FOLDER_PATH_KEY
from utils.paths.get_dirname import get_dirname

dirname = get_dirname(__file__)
task_folder_path = dirname.parent
task_name = task_folder_path.name

app.config[APP_TASK_NAME_KEY] = task_name
client = app.test_client()


@patch('utils.csv.get_remaining_trials.get_remaining_trials_with_trial_nums')
def test_trials(mocker, snapshot, tmp_path):
    app.config[ENV_FOLDER_PATH_KEY] = tmp_path
    seed(0)

    worker_id = "test_worker_pytest"

    response = client.post("/", json={
        "fn": "trials",
        "kwargs": {
            "worker_id": worker_id,
        }
    })

    assert response.status_code == 200, f"Code {response.status_code}: {response.data}"
    snapshot.assert_match(response.get_json())

    trial_file_path = tmp_path / "trials" / f"{worker_id}.csv"
    snapshot.assert_match(trial_file_path.read_text())

    counts_file_path = tmp_path / "counts.csv"
    snapshot.assert_match(counts_file_path.read_text())

    batch_file_path = tmp_path / "batch_num" / f"{worker_id}.csv"
    snapshot.assert_match(batch_file_path.read_text())

    mocker.return_value = [[], 0]
    response = client.post(
        "/", json={
            "fn": "trials",
            "kwargs": {
                "worker_id": worker_id,
                "new_batch": True,
            }
        }
    )

    batch_file_path = tmp_path / "batch_num" / f"{worker_id}.csv"
    snapshot.assert_match(batch_file_path.read_text())


def test_trials_consent(tmp_path):
    app.config[ENV_FOLDER_PATH_KEY] = tmp_path
    seed(0)

    worker_id = "test_worker_pytest"

    response = client.post("/", json={
        "fn": "trials",
        "kwargs": {
            "worker_id": worker_id,
        }
    })

    assert not response.get_json()["consent_agreed"]

    response = client.post("/", json={
        "fn": "consent",
        "kwargs": {
            "worker_id": worker_id,
        }
    })

    response = client.post("/", json={
        "fn": "trials",
        "kwargs": {
            "worker_id": worker_id,
        }
    })

    assert response.get_json()["consent_agreed"]


def test_trials_completed_demographics(tmp_path):
    app.config[ENV_FOLDER_PATH_KEY] = tmp_path
    seed(0)

    worker_id = "test_worker_pytest"

    response = client.post("/", json={
        "fn": "trials",
        "kwargs": {
            "worker_id": worker_id,
        }
    })

    assert not response.get_json()["completed_demographics"]

    response = client.post(
        "/",
        json={
            "fn": "demographics",
            "kwargs": {
                "worker_id": worker_id,
                "demographics": {
                    "age": 20,
                    "gender": "male",
                }
            }
        }
    )

    response = client.post("/", json={
        "fn": "trials",
        "kwargs": {
            "worker_id": worker_id,
        }
    })

    assert response.get_json()["completed_demographics"]
