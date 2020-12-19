const fs = require('fs');
const path = require('path');
// Use --only and create the array dynamically based on whatever is in the tasks/ folder

const blacklistedFolders = new Set(['__pycache__']);

const tasksFolderPath = path.join(__dirname, 'tasks');
const tasks = fs
  .readdirSync(tasksFolderPath)
  .filter(
    (item) =>
      fs.lstatSync(path.join(tasksFolderPath, item)).isDirectory() && !blacklistedFolders.has(item),
  );

const reloadFlag = '--reload';

const config = {
  apps: tasks.map((task) => ({
    name: task,
    script: `PIPENV_VENV_IN_PROJECT=1 PIPENV_IGNORE_VIRTUALENVS=1 pipenv run python3.7 main.py ${task} ${
      process.env.TASK_RELOAD_ENABLED ? reloadFlag : ''
    }`,
    instances: 1,
    max_memory_restart: '1G',
    log_file: path.join('tasks', task, 'logs', `${task}.log`),
    pid_file: path.join('tasks', task, `pm2.pid`),
  })),
};

module.exports = config;
