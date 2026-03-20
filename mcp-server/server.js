import dotenv from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { tools, toolHandlers } from "./tools/index.js";

dotenv.config();

const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const levels = { error: 0, warn: 1, info: 2, debug: 3 };

function log(level, message, meta) {
  if (levels[level] <= levels[LOG_LEVEL]) {
    const line = meta ? `${message} ${JSON.stringify(meta)}` : message;
    process.stderr.write(`[${new Date().toISOString()}] [${level}] ${line}\n`);
  }
}

const server = new Server(
  {
    name: "earnsure-mcp-server",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  log("info", "Tool call", { name });

  const handler = toolHandlers[name];
  if (!handler) {
    const error = `Unknown tool: ${name}`;
    log("error", error);
    return {
      content: [{ type: "text", text: JSON.stringify({ ok: false, error }) }],
    };
  }

  try {
    const result = await handler(args || {});
    return {
      content: [{ type: "text", text: JSON.stringify({ ok: true, result }) }],
    };
  } catch (err) {
    log("error", "Tool error", { name, message: err.message });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ ok: false, error: err.message }),
        },
      ],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

log("info", "EarnSure MCP server running (stdio)");
