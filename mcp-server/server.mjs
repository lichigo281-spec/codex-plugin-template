#!/usr/bin/env node
// 一个零依赖的最小 MCP（Model Context Protocol）stdio 服务器示例。
// 协议：每行一条 JSON-RPC 2.0 消息（stdin 读取，stdout 输出）。
// 注意：stdout 只能输出协议消息，日志请写到 stderr。

import { createInterface } from "node:readline";
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const SERVER_INFO = { name: "my-toolkit", version: "0.1.0" };
const NOTES_FILE = join(homedir(), ".my-toolkit", "notes.json");

// ---------------------------------------------------------------------------
// 工具定义：在这里添加你自己的工具
// ---------------------------------------------------------------------------
const tools = {
  hello: {
    description: "向指定的人打招呼（示例工具）。",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "要打招呼的名字" } },
      required: ["name"],
    },
    async handler({ name }) {
      return `你好，${name}！这条消息来自 my-toolkit MCP 服务器 👋`;
    },
  },

  get_time: {
    description: "获取当前时间，可指定 IANA 时区（如 Asia/Shanghai）。",
    inputSchema: {
      type: "object",
      properties: { timeZone: { type: "string", description: "IANA 时区，默认本机时区" } },
    },
    async handler({ timeZone } = {}) {
      const now = new Date();
      const text = now.toLocaleString("zh-CN", { timeZone, hour12: false });
      return `${text}（${timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone}）`;
    },
  },

  notes_add: {
    description: "保存一条笔记到本地（~/.my-toolkit/notes.json）。",
    inputSchema: {
      type: "object",
      properties: { content: { type: "string", description: "笔记内容" } },
      required: ["content"],
    },
    async handler({ content }) {
      const notes = await loadNotes();
      const note = { id: notes.length + 1, content, createdAt: new Date().toISOString() };
      notes.push(note);
      await saveNotes(notes);
      return `已保存笔记 #${note.id}`;
    },
  },

  notes_list: {
    description: "列出所有已保存的本地笔记。",
    inputSchema: { type: "object", properties: {} },
    async handler() {
      const notes = await loadNotes();
      if (notes.length === 0) return "还没有任何笔记。";
      return notes.map((n) => `#${n.id} [${n.createdAt}] ${n.content}`).join("\n");
    },
  },
};

async function loadNotes() {
  try {
    return JSON.parse(await readFile(NOTES_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function saveNotes(notes) {
  await mkdir(join(homedir(), ".my-toolkit"), { recursive: true });
  await writeFile(NOTES_FILE, JSON.stringify(notes, null, 2), "utf8");
}

// ---------------------------------------------------------------------------
// JSON-RPC / MCP 处理
// ---------------------------------------------------------------------------
function send(message) {
  process.stdout.write(JSON.stringify(message) + "\n");
}

async function handle(msg) {
  const { id, method, params } = msg;
  const isRequest = id !== undefined && id !== null;

  switch (method) {
    case "initialize":
      return {
        protocolVersion: params?.protocolVersion ?? "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      };
    case "ping":
      return {};
    case "tools/list":
      return {
        tools: Object.entries(tools).map(([name, t]) => ({
          name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      };
    case "tools/call": {
      const tool = tools[params?.name];
      if (!tool) {
        return { content: [{ type: "text", text: `未知工具：${params?.name}` }], isError: true };
      }
      try {
        const text = await tool.handler(params.arguments ?? {});
        return { content: [{ type: "text", text: String(text) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `执行失败：${err.message}` }], isError: true };
      }
    }
    default:
      if (method?.startsWith("notifications/")) return undefined; // 通知无需响应
      if (isRequest) throw Object.assign(new Error(`Method not found: ${method}`), { code: -32601 });
      return undefined;
  }
}

const rl = createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    return;
  }
  const isRequest = msg.id !== undefined && msg.id !== null;
  try {
    const result = await handle(msg);
    if (isRequest) send({ jsonrpc: "2.0", id: msg.id, result: result ?? {} });
  } catch (err) {
    if (isRequest) send({ jsonrpc: "2.0", id: msg.id, error: { code: err.code ?? -32603, message: err.message } });
  }
});

console.error(`[my-toolkit] MCP server started (pid ${process.pid})`);
