module.exports = {
  apps: [
    {
      name: 'crm-sinergi',
      script: 'node_modules/.bin/next',
      args: 'start --port 8081',
      cwd: '/home/sinergi/crm-sinergi',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 8081,
      },
    },
  ],
};
