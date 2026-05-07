module.exports = {
  apps: [
    {
      name: "SkyAlertBot",
      script: "dist/index.js",
      cwd: "/Users/leobernstein/SkyAlertBot",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "Fur-Bot",
      script: "venv/bin/python",
      args: "bot.py",
      cwd: "/Users/leobernstein/Desktop/Fur-Bot",
      watch: false
    }
  ]
};
