import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../lib/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let clientPromise = null;
let queue = Promise.resolve();

async function initClient() {
  const serverPath = process.env.MCP_SERVER_PATH
    ? path.resolve(process.env.MCP_SERVER_PATH)
    : path.resolve(__dirname, "..", "..", "..", "mcp-server", "server.js");
  const command = process.env.MCP_SERVER_CMD || "node";

  const transport = new StdioClientTransport({ command, args: [serverPath] });
  const client = new Client(
    { name: "earnsure-backend", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  logger.info({ serverPath }, "MCP client connected");
  return client;
}

async function getClient() {
  if (!clientPromise) {
    clientPromise = initClient();
  }
  return clientPromise;
}

export function callMcpTool(name, args) {
  queue = queue.then(async () => {
    const client = await getClient();
    return client.request(CallToolRequestSchema, { name, arguments: args });
  });

  return queue
    .then((response) => {
      const text = response?.content?.[0]?.text || "{}";
      const parsed = JSON.parse(text);
      if (!parsed.ok) {
        throw new Error(parsed.error || `MCP tool ${name} failed`);
      }
      return parsed.result;
    })
    .catch((err) => {
      queue = Promise.resolve();
      throw err;
    });
}
