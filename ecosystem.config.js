module.exports = {
  apps: [
    {
      name: 'SkySentinal',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production'
      },
      watch: false,
      autorestart: true,
      max_memory_restart: '1G'
    }
  ]
};
