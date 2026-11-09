module.exports = {
  apps: [
    {
      name: "yadakdiamond",
      script: ".output/server/index.mjs",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      node_args: "--env-file=.env",
      env: {
        NODE_ENV: "production",
        PORT: 8080,
      },
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
