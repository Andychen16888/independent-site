module.exports = {
  apps: [
    {
      name: "b2b-independent-site",
      script: ".next/standalone/server.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: 3000,
        // 上传目录固定在项目根目录 uploads/。
        // 绝对不能落在 .next/standalone/uploads —— standalone 每次 next build 都会被重写，
        // 落在里面的用户上传图片会在重新部署后全部丢失（产品图显示不出来）。
        UPLOAD_DIR: __dirname + "/uploads",
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      // 1 核 1GB VPS：限制 Node 堆在 768MB，RSS 到 900MB 就重启，
      // 避免整机 OOM（PostgreSQL + nginx 还需要内存）。
      node_args: "--max-old-space-size=768",
      max_memory_restart: "900M",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
}
