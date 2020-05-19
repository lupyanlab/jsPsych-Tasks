# Tasks Monorepo

## Opening a Task Link

Each task takes a set of [query string parameters](https://en.wikipedia.org/wiki/Query_string) as input in its URL.

**Important!** Please read the task's README before opening the task. This is especially important for knowing what to set the URL query string.

Every task is hosted on http://sapir.psych.wisc.edu/mturk/sandbox/tasks/<task_name>/index.html where <task_name> is the name of the task. For example: http://sapir.psych.wisc.edu/mturk/sandbox/tasks/TypicalityImageRate/index.html

Then the query string comes after the pathname with a leading `?`. For example: http://sapir.psych.wisc.edu/mturk/sandbox/tasks/TypicalityImageRate/index.html?workerId=test&fullscreen=false&dev=true&reset=false where `?workerId=test&fullscreen=false&dev=true&reset=false` is its query string with parameters `workerId`, `fullscreen`, `dev`, and `reset` set.

## Development

### Trials and Data

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
- Restarting Stopped/Errored Server
  ```sh
  npm run pm2:restart
  ```

## Differences Between Before & After Refactor (4/6/2020)

- Trials and data collection
  - **Before**: Dev and prod trials and data are under same folder
  - **After**: Dev and prod trials and data are separated under `/dev` and `/prod` respectively
- Codebase
  - **Before**: Tasks are in separate repos
  - **After**: Tasks are all in `/tasks` folder and all share same utils, libraries, and server files
- Server
  - **Before**: Multiple servers
  - **After**: Single server calling different task modules under `tasks/template/task.py`

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