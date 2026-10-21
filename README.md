# Codex Plugin Template · My Toolkit

一个可以直接复制改造的 **Codex 插件模板**，结构参考 [infinite-canvas](https://github.com/basketikun/infinite-canvas) 的插件实现：

- 📦 `plugin.json`：插件元信息与界面展示配置
- 🧠 `skills/`：示例技能（`hello`、`notes`）
- 🔌 `.mcp.json` + `mcp-server/`：一个 **零依赖** 的 Node.js MCP 服务器，提供 4 个工具

| 工具 | 说明 |
| --- | --- |
| `hello` | 打招呼（示例） |
| `get_time` | 获取当前时间，支持 IANA 时区 |
| `notes_add` | 保存笔记到 `~/.my-toolkit/notes.json` |
| `notes_list` | 列出已保存的笔记 |

## 目录结构

```text
.
├── .agents/plugins/marketplace.json     # 本地插件市场清单（让 Codex 发现插件）
├── plugins/my-toolkit/
│   ├── .codex-plugin/plugin.json        # 插件清单
│   ├── .mcp.json                        # MCP 服务器启动配置
│   ├── assets/icon.png                  # 插件图标
│   └── skills/
│       ├── hello/SKILL.md
│       └── notes/SKILL.md
├── mcp-server/
│   ├── server.mjs                       # 零依赖 MCP stdio 服务器
│   └── test.mjs                         # 冒烟测试
└── package.json                         # 让 npx github:... 可以直接运行 MCP 服务器
```

## 安装

需要：[Codex CLI](https://github.com/openai/codex)、Node.js >= 18。

macOS / Linux：

```bash
git clone https://github.com/lichigo281-spec/codex-plugin-template.git
cd codex-plugin-template
codex plugin marketplace add "$(pwd)"
codex plugin add my-toolkit@codex-plugin-template
```

Windows PowerShell：

```powershell
git clone https://github.com/lichigo281-spec/codex-plugin-template.git
cd codex-plugin-template
codex plugin marketplace add "$PWD"
codex plugin add my-toolkit@codex-plugin-template
```

安装后新开一个 Codex 会话，试试：

```text
用 my-toolkit 跟我打个招呼
帮我记一条笔记：明天下午三点开会
```

## 本地开发

```bash
npm test          # 运行 MCP 冒烟测试
npm start         # 手动启动 MCP 服务器（stdio）
```

`.mcp.json` 默认通过 `npx -y github:lichigo281-spec/codex-plugin-template` 从 GitHub 拉取并启动服务器。
本地调试时可改为直接用 node 运行（填写绝对路径）：

```json
{
  "mcpServers": {
    "my-toolkit": {
      "command": "node",
      "args": ["/绝对路径/codex-plugin-template/mcp-server/server.mjs"]
    }
  }
}
```

## 改造成你自己的插件

1. 把 `plugins/my-toolkit` 重命名，并同步修改 `plugin.json` 的 `name` 和 `marketplace.json` 中的 `name` / `path`。
2. 在 `mcp-server/server.mjs` 的 `tools` 对象里添加/修改工具（描述 + `inputSchema` + `handler`）。
3. 在 `skills/` 下新建目录和 `SKILL.md`，写清楚 **何时使用**、**工作流程**、**约束**。
4. 替换 `assets/icon.png`，修改 `plugin.json` 中的 `interface` 展示信息。
5. 若仓库地址变了，记得同步修改 `.mcp.json` 中的 `github:用户名/仓库名`。

## License

MIT
