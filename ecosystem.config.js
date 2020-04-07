module.exports = {
  apps: [
    {
      name: 'tasks-server',
      script: 'pipenv run flask run --port 7124 --host 0.0.0.0',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        FLASK_APP: 'client/client.py',
      },
    },
  ],
};
