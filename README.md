# Tasks Monorepo

## Opening a Task Link

Each task takes a set of [query string parameters](https://en.wikipedia.org/wiki/Query_string) as input in its URL.

**Important!** Please read the task's README before opening the task. This is especially important for knowing what to set the URL query string.

Every task is hosted on http://sapir.psych.wisc.edu/mturk/sandbox/tasks/<task_name>/index.html where <task_name> is the name of the task. For example: http://sapir.psych.wisc.edu/mturk/sandbox/tasks/TypicalityImageRate/index.html

Then the query string comes after the pathname with a leading `?`. For example: http://sapir.psych.wisc.edu/mturk/sandbox/tasks/TypicalityImageRate/index.html?workerId=test&fullscreen=false&dev=true&reset=false where `?workerId=test&fullscreen=false&dev=true&reset=false` is its query string with parameters `workerId`, `fullscreen`, `dev`, and `reset` set.

## Development

### Local Development Setup

### Method 1: Docker

#### Prerequisites

- Docker installed

#### Steps

- Run `docker-compose up --build` at the respository root (i.e. `jsPsych-Tasks/`)
- Open the browser at `http://localhost:5000/tasks/<task>?workerId=test123` where `<task>` is the task folder name and `?workerId=test123` can be any URL parameters described in the task folder's README file.
  - Note that `index.html` is not part of the path unlike on Sapir which includes `index.html` in the path (i.e. `http://sapir.psych.wisc.edu/mturk/sandbox/tasks/<task>/index.html?workerId=test`).

### Method 2: Without Docker

#### Prerequisites

- Python 2 (not 3)
- Pipenv installed via Pip (`pip install pipenv`)
- Node.js (LTS version)
  - `npm` and `npx` commands are bundled with Node.js

#### Steps

- Run `npm install` at the respository root (i.e. `jsPsych-Tasks/`)
- Run `pipenv install`
- Run `npm start`
- Open a new terminal
- Run `npx serve`
- Open the browser at `http://localhost:5000/tasks/<task>?workerId=test123` where `<task>` is the task folder name and `?workerId=test123` can be any URL parameters described in the task folder's README file.
  - Note that `index.html` is not part of the path unlike on Sapir which includes `index.html` in the path (i.e. `http://sapir.psych.wisc.edu/mturk/sandbox/tasks/<task>/index.html?workerId=test`).

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
  - **Before**: Multiple servers
  - **After**: Single server calling different task modules under `tasks/template/task.py`
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
