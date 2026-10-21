// 简单冒烟测试：启动 MCP 服务器，依次发送 initialize / tools/list / tools/call。
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const server = spawn(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), "server.mjs")], {
  stdio: ["pipe", "pipe", "inherit"],
});

const requests = [
  { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } } },
  { jsonrpc: "2.0", method: "notifications/initialized" },
  { jsonrpc: "2.0", id: 2, method: "tools/list" },
  { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "hello", arguments: { name: "世界" } } },
  { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "get_time", arguments: { timeZone: "Asia/Shanghai" } } },
];

const expected = new Set([1, 2, 3, 4]);
let buffer = "";
server.stdout.on("data", (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, idx);
    buffer = buffer.slice(idx + 1);
    const msg = JSON.parse(line);
    console.log(JSON.stringify(msg));
    if (msg.error) {
      console.error("❌ 收到错误响应");
      process.exit(1);
    }
    expected.delete(msg.id);
    if (expected.size === 0) {
      console.log("✅ 全部通过");
      server.kill();
      process.exit(0);
    }
  }
});

for (const r of requests) server.stdin.write(JSON.stringify(r) + "\n");
setTimeout(() => {
  console.error("❌ 超时");
  server.kill();
  process.exit(1);
}, 5000);
