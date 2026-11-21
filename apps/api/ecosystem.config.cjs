module.exports = {
  apps: [
    {
      name: "absensi-api",
      script: "src/server.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        TZ: "Asia/Jakarta",
        NODE_OPTIONS: "--dns-result-order=ipv4first",
      },
    },
  ],
};
