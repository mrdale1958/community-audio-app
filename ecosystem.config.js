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
        DATABASE_URL: "file:/home/bitnami/readmyname/prisma/production.db",
        NEXTAUTH_URL: "https://www.aidsquilttouch.org/readmyname",
        NEXTAUTH_SECRET: "Igp9/Y+F+Mz/syhzILUzTI5i7uaa+SEEqNeimJTYHWo="
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      log_date_format: "YYYY-MM-DD HH:mm Z"
    }
  ]
};
