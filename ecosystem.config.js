// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'read-my-name',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/read-my-name',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/read-my-name/error.log',
    out_file: '/var/log/read-my-name/out.log',
    log_file: '/var/log/read-my-name/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
};