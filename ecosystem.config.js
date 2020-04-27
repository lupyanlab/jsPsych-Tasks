module.exports = {
  apps: [
    {
      name: 'tasks-server',
      script: 'pipenv run flask run --port 7124 --host 0.0.0.0',
      instances: 1,
      autorestart: true,
      watch: ['**/*.py'],
      max_memory_restart: '1G',
      error_file: 'logs/tasks-server-error.log',
      out_file: 'logs/tasks-server-out.log',
      log_file: 'logs/tasks-server.log',
      time: true,
      env: {
        FLASK_APP: 'client/client.py',
      },
    },
  ],
};
