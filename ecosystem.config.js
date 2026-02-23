module.exports = {
    apps: [{
        name: "skysentinel",
        script: "./dist/index.js",
        watch: false,
        env: {
            NODE_ENV: "production",
        },
        // Error handling
        error_file: "./logs/err.log",
        out_file: "./logs/out.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss Z",
        // Restart on crash
        autorestart: true,
        max_memory_restart: "1G",
    }]
};
