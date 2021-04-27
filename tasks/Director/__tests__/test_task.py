from random import seed
from tasks.Director.task import randomize_trials
from pathlib import Path

import task_runner.routes  # pylint: disable=unused-import
from task_runner.app import app
from utils.constants import APP_TASK_NAME_KEY, ENV_FOLDER_PATH_KEY
from utils.paths.get_dirname import get_dirname
from utils.csv.read_rows import read_rows

dirname = get_dirname(__file__)
task_folder_path = dirname.parent
task_name = task_folder_path.name

app.config[APP_TASK_NAME_KEY] = task_name
client = app.test_client()


def test_randomize_trials(snapshot):
    seed(0)
    trials = read_rows(dirname / Path("resources/exp3_director_input_test_english_1.csv"))
    actual_trials = randomize_trials(trials)
    prev_implicit_term = None
    curr_implicit_term = None
    for trial in actual_trials:
        curr_implicit_term = trial["implicit_term"]
        assert curr_implicit_term != prev_implicit_term
        prev_implicit_term = curr_implicit_term

    assert len(trials) == len(actual_trials)
    snapshot.assert_match(actual_trials)


# def test_trials(snapshot, tmp_path):
#     app.config[ENV_FOLDER_PATH_KEY] = tmp_path
#     seed(0)

#     worker_id = "test_worker_pytest"

#     response = client.post("/", json={
#         "fn": "trials",
#         "kwargs": {
#             "worker_id": worker_id,
#         }
#     })

#     assert response.status_code == 200, f"Code {response.status_code}: {response.data}"
#     snapshot.assert_match(response.get_json())

#     trial_file_path = tmp_path / "trials" / f"{worker_id}.csv"
#     snapshot.assert_match(trial_file_path.read_text())

#     counts_file_path = tmp_path / "counts.csv"
#     snapshot.assert_match(counts_file_path.read_text())

# def test_trials_consent(tmp_path):
#     app.config[ENV_FOLDER_PATH_KEY] = tmp_path
#     seed(0)

#     worker_id = "test_worker_pytest"

#     response = client.post("/", json={
#         "fn": "trials",
#         "kwargs": {
#             "worker_id": worker_id,
#         }
#     })

#     assert not response.get_json()["consent_agreed"]

#     response = client.post("/", json={
#         "fn": "consent",
#         "kwargs": {
#             "worker_id": worker_id,
#         }
#     })

#     response = client.post("/", json={
#         "fn": "trials",
#         "kwargs": {
#             "worker_id": worker_id,
#         }
#     })

#     assert response.get_json()["consent_agreed"]

# def test_trials_completed_demographics(tmp_path):
#     app.config[ENV_FOLDER_PATH_KEY] = tmp_path
#     seed(0)

#     worker_id = "test_worker_pytest"

#     response = client.post("/", json={
#         "fn": "trials",
#         "kwargs": {
#             "worker_id": worker_id,
#         }
#     })

#     assert not response.get_json()["completed_demographics"]

#     response = client.post(
#         "/",
#         json={
#             "fn": "demographics",
#             "kwargs": {
#                 "worker_id": worker_id,
#                 "demographics": {
#                     "age": 20,
#                     "gender": "male",
#                 }
#             }
#         }
#     )

#     response = client.post("/", json={
#         "fn": "trials",
#         "kwargs": {
#             "worker_id": worker_id,
#         }
#     })

#     assert response.get_json()["completed_demographics"]
