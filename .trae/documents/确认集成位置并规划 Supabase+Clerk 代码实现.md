经过分析，您在 `mcp.json` 文件中的 Supabase 配置无效，主要是因为 **JSON 格式存在语法错误**。

具体问题如下：
1.  **缺少逗号**：在 `supabase` 配置块结束的大括号 `}` 后，缺少一个逗号 `,`，导致后续的 `clerk` 配置无法被正确解析。
2.  **多余逗号**：在 `supabase` 的 `url` 行末尾有一个多余的逗号（标准 JSON 不允许在最后一项后加逗号）。

我将为您修复这些语法错误。

### 修复计划
1.  读取 `mcp.json` 文件。
2.  修改文件内容，修复 JSON 语法错误：
    -   移除 `supabase` -> `url` 行末尾的逗号。
    -   在 `supabase` 块结束后添加逗号。
3.  保存文件。

修复后的 `mcp.json` 结构将如下所示：
```json
{
    "mcpServers": {
        "Framelink MCP for Figma": {
            "command": "npx",
            "args": [
                "-y",
                "figma-developer-mcp",
                "--figma-api-key=...",
                "--stdio"
            ]
        },
        "supabase": {
            "url": "https://mcp.supabase.com/mcp?project_ref=ikinmqhpheukudzxagax"
        },
        "clerk": {
            "url": "https://mcp.clerk.com/mcp",
            "headers": {}
        }
    }
}
```

请确认是否执行此修复。