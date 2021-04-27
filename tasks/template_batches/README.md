# template_batches

## Files and Folders

- `prod|dev`
  - `batch_num`
    - Metadata containing info on current worker batches status
  - `consent`
    - Created on a worker's consent
  - `data`
    - Data collected per trial
  - `demographics`
    - Demographics collected per worker
  - `trials`
    - Trials generated by `task.py`
  - `counts.csv`
    - Trial list counts used for balancing
- `demographics.js`
  - Demographics question list in JavaScript
- `experiment.js`
  - jsPsych Frontend
- `task.py`
  - Python Backend API

### Important Notes

Delete or modify `counts.csv` and `batch_num` files upon adding/renaming/removing files in `trial_lists` folder.

## Query Params

### Required

- `workerId`: Worker Id

### Optional

- `dev`: Put all data in `/dev` folder
  - Default: `false`
- `fullscreen`: Enable fullscreen
  - Default: `true`
- `max_batch_num`: Maximum number of batches allowed
  - Default: `''` Will allow infinite number of batches
- `reset`: Reset current worker's data collected (Warning: current worker's data will be lost.)
  - Default: `false`
- `consent`: Relative path to consent file without `.html` extension
  - Default: `consent`