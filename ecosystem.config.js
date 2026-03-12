module.exports = {
    apps: [
        {
            name: "9wapi",
            script: "./server.js",
            instances: "max", // Use all CPU cores
            exec_mode: "cluster",
            watch: false,
            max_memory_restart: "1G", // Increased for better stability
            env: {
                NODE_ENV: "production",
            },
            log_date_format: "YYYY-MM-DD HH:mm Z",
            error_file: "./logs/pm2-error.log",
            out_file: "./logs/pm2-out.log",
            merge_logs: true,
        },
    ],
};
