# Tasks Monorepo

## Folder Structure

## Development

- `tasks/template/prod`
  - Prod data
- `tasks/template/dev`
  - Dev data
- `tasks/template/task.py`
  - Generating trials
  - Reading from and writing to CSV
- `tasks/template/experiment.js`
  - JsPsych Trial inputs
  - Data collection
- `lib/jspsych-6.1.0/plugins`
  - Custom reusable JsPsych trials
- `logs/`
  - Server logs

## Communicating from `experiment.js` to `task.py` and back

In `experiment.js`, call function `api` and pass the Python function to call with its keyword arguments (`kwargs`) in `task.py`:

```py
# tasks/template/task.py

class Task:

  def foo(self, worker_id, reset=False):
    return { "my_key": "pong" }
```

```js
// tasks/template/experiment.js

// Calling
api({ fn: 'foo', kwargs: { worker: 'ping' } });

// Calling and reading response
const { my_key } = await api({ fn: 'foo', kwargs: { worker: 'ping' } });
// my_key === 'pong'
```

## Server

There is only a single server for all tasks. There should be no need to restart a server after any code changes because the latest `task.py` is always used. Logging for the server is found under `/logs`.

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
