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
      // 内存相关（防止 504）：首页是全动态 SSR，首次访问还会触发 next/image 图像优化
      // （sharp），单进程冷启动瞬间内存可轻松超过 1G。
      //   - max_memory_restart 设 1G 容易被瞬时峰值"误杀"，PM2 反复重启 → 每个请求
      //     都挂在转发上 → nginx 报 "504 Gateway Time-out"。调到 2G。
      //   - node_args 提高 Node 堆上限，避免进程过早触发 GC/OOM。
      // 若服务器内存很小（如 1G），请下调为: node_args "--max-old-space-size=768"、
      //   max_memory_restart "1G"，并留意部署后首次访问的 pm2 status 重启次数。
      node_args: "--max-old-space-size=2048",
      max_memory_restart: "2G",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
}
