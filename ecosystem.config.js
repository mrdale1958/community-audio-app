module.exports = {
  apps: [
    {
      name: "readmyname-production",
      script: "npm",
      args: "start",
      cwd: "/home/bitnami/readmyname",
      env: {
        NODE_ENV: "production",
        PORT: 3100,
        NEXTAUTH_URL: "https://www.aidsquilttouch.org/readmyname",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      log_date_format: "YYYY-MM-DD HH:mm Z"
    }
  ]
};
