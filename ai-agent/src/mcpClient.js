import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function connectMcpClient() {
  const serverPath = process.env.MCP_SERVER_PATH
    ? path.resolve(process.env.MCP_SERVER_PATH)
    : path.resolve(__dirname, "..", "..", "mcp-server", "server.js");

  const command = process.env.MCP_SERVER_CMD || "node";
  const args = [serverPath];

  const transport = new StdioClientTransport({ command, args });
  const client = new Client(
    { name: "earnsure-ai-agent", version: "0.1.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  return client;
}

export async function callTool(client, name, args) {
  return client.request(CallToolRequestSchema, {
    name,
    arguments: args,
  });
}
