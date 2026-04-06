// PM2 process pool for music-quiz local dev.
// Run via: ./scripts/pm2-pool.sh up
//
// We invoke `node` directly (not pnpm/npm) to avoid the wrapper-zombie
// problem where the shell wrapper survives a child crash and PM2 never
// restarts.

const path = require("node:path");
const fs = require("node:fs");

// Load .env so HOME_API_KEY is available to the home-controller process.
const envPath = path.join(__dirname, ".env");
const env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

module.exports = {
  apps: [
    {
      name: "music-quiz",
      script: "packages/mcp-server/server.js",
      interpreter: "node",
      cwd: __dirname,
      env: {
        ...env,
        PORT: "3000",
        NODE_ENV: "development",
      },
      autorestart: true,
      listen_timeout: 15000,
      kill_timeout: 5000,
      max_memory_restart: "1G",
      time: true,
    },
    {
      name: "home-controller",
      script: "dist/server.js",
      interpreter: "node",
      cwd: path.join(__dirname, "home"),
      env: {
        ...env,
        MCP_WS_URL: "ws://localhost:3000/home-ws",
      },
      autorestart: true,
      listen_timeout: 15000,
      kill_timeout: 5000,
      max_memory_restart: "512M",
      time: true,
    },
  ],
};
