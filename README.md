# Tasks Monorepo

# TL;DR

> Whenever `<folder_name>` is used, it refers to the folder name of the task.
>
> **Note** All the below tasks are run under the `tasks/<folder_name>` directory

## Copying a new task folder

```sh
# After copying, run
make reload
```

## Editing existing `task.py`:

### Method 1

```sh
# Run everytime you save a new change in onlytask.py
make
```

### Method 2 (Auto reloading on file change)

```sh
# Ensure task is running
# And ensure auto reload is enabled (check that npm_lifecycle_event is *reload* and not *start*)
make status
make show

# If either above not met (not running or is not in auto reload mode)
make reload

```

## Before MTurk

```sh
# Run to disable the auto reloading effect
make
```

## Opening on the browser

Example link (replace query parameters with whatever is in the task's repsective `README.md`):

```
http://sapir.psych.wisc.edu/mturk/jsPsych-Tasks/tasks/<folder_name>/index.html?workerId=test&fullscreen=false&dev=true&reset=false
```

where `?workerId=test&fullscreen=false&dev=true&reset=false` is its query string with parameters `workerId`, `fullscreen`, `dev`, and `reset` set.

<!--
## Running Pytest tests

```sh
# Run following if haven't before for this account
sh configure.sh && source ~/.bashrc

# Enter Pipenv shell
pipenv shell

# You can now run any pytest, python, and coverage scripts
``` -->

# Overview

This is a single code repository for all the tasks. Each task consists of a `experiment.js` for the frontend (JavaScript) and a `task.py` for the backend (Python). This code repository is structured such that tasks can have their unique logic within their task folder under `tasks` and have shared logic in folders in `utils` (utility/helper functions) and `lib` (third-party libraries). There is also a shared list of packages (`Pipfile`) that is used for all the tasks.

This code structure is meant to enable convenient code editing on Sapir.

Check the `README.md` in the folders for more specific information relating to the folder and usage.

# Local Setup From Scratch

> Still WIP

## Prerequisites

- Python 3.7+ (Command `python3.7` is available)
- Pipenv installed via Pip (`pip install pipenv`)
- Node.js (LTS version)

## Initial Setup Steps

These steps are only meant

1. Run `git clone https://github.com/lupyanlab/jsPsych-Tasks`
   - Clones the code repository from GitHub
2. Run `git checkout master-v2`
   - Switch to the most updated framework branch.
3. Run `sh configure.sh`
   - Sets the proper environment variables in `~/.bashrc` to install the virtual environment and Python packages within the project directory. This is to avoid the problem where users would install their own copy of the virtual environment and packages within their home directory which will conflict with other users' installations.
4. Run `source ~/.bashrc`
   - Loads the new environment variables inserted from the previous step into the current terminal bash instance.
5. Run `npm install`
   - Installs the listed Node dependencies from `package.json`
6. Run `pipenv install`
   - Installs the listed Python packages from Pipfile
7. Run `npm run logrotate`
   - Starts a process that will maintain reasonable log state. https://github.com/keymetrics/pm2-logrotate

## Starting New Task Servers

Each task has their own server that lives in the `tasks` folder. The run scripts can be run anywhere from under the project directory.

The task server can be started and will update on new changes in `task.py` by running

```sh
npm run reload -- --only <folder_name>
# where <folder_name> is the name of the folder under tasks
# (i.e. npm run reload -- --only template)
```

When the task server is ready for public traffic, run the following to disable the update on new changes and use a production WSGI server.

```sh
npm run start -- --only <folder_name>
# (i.e. npm run start -- --only template)
# Note: In constrast to the previous reload command, this is using npm run start instread.
```

## Starting Local Web HTML Server

The

- Open a new terminal
- Run `npx serve`
- Open the browser at `http://localhost:5000/tasks/<task>?workerId=test123` where `<task>` is the task folder name and `?workerId=test123` can be any URL parameters described in the task folder's README file.
  - Note that `index.html` is not part of the path unlike on Sapir which includes `index.html` in the path (i.e. `http://sapir.psych.wisc.edu/mturk/sandbox/tasks/<task>/index.html?workerId=test`).

## Logs

Logs are stored within the `tasks` folder.

To flush or clear the logs, run

```
npm run flush -- <folder_name>
```

## Opening a Task Link

Each task takes a set of [query string parameters](https://en.wikipedia.org/wiki/Query_string) as input in its URL.

**Important!** Please read the task's README before opening the task. This is especially important for knowing what to set the URL query string.

Every task is hosted on http://sapir.psych.wisc.edu/mturk/sandbox/tasks/<task_name>/index.html where <task_name> is the name of the task. For example: http://sapir.psych.wisc.edu/mturk/sandbox/tasks/TypicalityImageRate/index.html

Then the query string comes after the pathname with a leading `?`. For example: http://sapir.psych.wisc.edu/mturk/sandbox/tasks/TypicalityImageRate/index.html?workerId=test&fullscreen=false&dev=true&reset=false where `?workerId=test&fullscreen=false&dev=true&reset=false` is its query string with parameters `workerId`, `fullscreen`, `dev`, and `reset` set.

## Trials and Data

- `tasks/<task>/prod`
  - Prod data when query param `dev=False` (default)
- `tasks/<task>/dev`
  - Dev data when query param `dev=True`

### Code

- `tasks/<task>/task.py` (Python)
  - Generating trials
  - Reading from and writing to CSV
- `tasks/<task>/experiment.js` (JavaScript)
  - JsPsych Trial inputs
  - Data collection
- `lib/jspsych-6.1.0/plugins` (jsPsych)
  - Custom reusable JsPsych trials
- `logs/` (Logs)
  - Server logs

## Communicating from `experiment.js` to `task.py` and back

In `experiment.js`, call function `api` and pass the Python function to call with its keyword arguments (`kwargs`) in `task.py`:

```py
# tasks/<task>/task.py

class Task:

  def trials(self, worker_id, reset=False):
    return { "trials": [{ "image": "pic.jpg" }] }, 200
    # Note: Returning 200 preferred to indicate a successful response.
    # This is optional however.

  def data(self, worker_id, response):
    print(response)
    # "5"
```

```js
// tasks/<task>/experiment.js

// Calling and reading response
const worker_id = 'subject';
const { trials } = await api({ fn: 'trials', kwargs: { worker_id } }); // calls Task's trials function
console.log(trials);
// [{ image: 'pic.jpg' }]

// Only calling
const response = '5';
api({ fn: 'data', kwargs: { worker_id, response } }); // calls Task's data function
```

## Server

There is only a single server for all tasks. Hence there is only a single port used for everything. Defining a unique task name at the top of `experiment.js` file that is the same name of the folder of the task will be enough to distinguish the api requests.

```js
// tasks/<task>/experiment.js
const TASK = 'TypicalityImageRate';
```

There should be no need to restart a server after any code changes because the latest `task.py` is always loaded dynamically. Logging for the server is found under `/logs`.

- Checking Server Status
  ```sh
  npm run pm2:status
  ```
- Restarting Stopped/Errored Server (No logging)
  ```sh
  npm run restart
  ```

## Unit testing

Pytest is setup for this repository. It can be run with the `pytest -vv --color=yes <test_file_name>` command.

The following is a Visual Studio Code `launch.json` configuration that can be used to run and debug the current test file.

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "PyTest",
      "type": "python",
      "request": "launch",
      "stopOnEntry": false,
      "pythonPath": "${config:python.interpreterPath}",
      "module": "pytest",
      "args": ["-vv", "--color=yes", "${relativeFile}"],
      "cwd": "${workspaceRoot}",
      "env": {},
      "debugOptions": ["WaitOnAbnormalExit", "WaitOnNormalExit", "RedirectOutput"],
      "console": "integratedTerminal"
    }
  ]
}
```

## Differences Between Before & After Refactor (12/6/2020)

- Logging
  - **Before**: Logging was shared in a single location under `logs/`. This caused an unorganized mix of different task logs into one. Inbound and outbound messages were included in the logs. They took up too much space in memory.
  - **After**: Logging is now separated into a `logs/` file insided each task. This organizes the logs into their respective tasks. Inbound and outbound messages are not excluded in the logs.
- Processes
  - **Before**: Only a single process and thus a single port was used.
  - **After**: Each task is now a separate independent process and each uses any of the open public ports (:7100-:7199).
- Python 3.7
  - **Before**: Python 2.7
  - **After**: Python 3.7. Now, dictionaries are ordered by dictionary type so all ordering will be optional.
- Reloading
  - **Before**: Entire single server would reload if any \*.py file was changed.
  - **After**: Task server will reload only if any relevant module \*.py files were changed. Reloading can be manually disabled too when it's not appropriate.

<!-- - `utils/`

  - Reusable JavaScript and Python helper functions
  - Import usage of in
    JavaScript (`foo.js`):
    ```js
    // index.js
    import foo from '../../utils/foo.js';
    ```
    and Python (`foo.py`):
    ```py
    # task.py
    from utils import foo
    ``` -->

<!-- ### Adding a new task (WIP)

Run command

```bash
npm run create:task -- <name>
```

Where `<name>` is the name of the new task. The script generates a new task folder under `./tasks` based on the template `./tasks/template`.

For example, running `npm run create-task -- MyNewTask` will generate a new task folder called `./tasks/MyNewTask`.

### Adding a new plugin (WIP)

TODO:

Run command

```bash
npm run create:plugin -- <name>
```

Where `<name>` is the name of the new task omitting `lupyanlab-`. The script generates a new plugin under `./lib/jspsych-6.1.0/plugins` based on the template `./tasks/template`.

For example, running `npm run create-plugin -- my-new-plugin` will generate a new plugin file called `./lib/jspsych-6.1.0/plugins/lupyanlab-my-new-plugin.js`. After that, the plugin must be referenced with the prefix `lupyanlab-`. -->

## Setup from Git

1. Clone the repo

   ```bash
   git clone <repo_url>
   ```

2. Install all dependencies

   ```bash
   npm install
   pipenv install
   ```

## `.htaccess`

The `.htaccess` file contains a whitelist for accessible files and other Apache 2 specific options.

## Troubleshoot

If you get this problem:

```
pkg_resources.VersionConflict: (importlib-metadata 3.3.0 (/home/kmui2/.pyenv/versions/anaconda3-2020.02/lib/python3.7/site-packages), Requirement.parse('importlib-metadata<2,>=0.12; python_version < "3.8"'))
```

Upgrade virtualenv:

```
.venv/bin/python -m pip install -U virtualenv
```
