import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectMcpClient, callTool } from "./mcpClient.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const systemPrompt = fs.readFileSync(
  path.join(__dirname, "prompts", "system.txt"),
  "utf8"
);

async function decideAction(userInput) {
  const payload = {
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  };

  const response = await fetch(
    `${process.env.OPENAI_BASE_URL || "https://api.openai.com"}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI request failed: ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content);
}

async function run() {
  const userInput = process.argv.slice(2).join(" ");
  if (!userInput) {
    console.log("Provide a prompt, e.g. node src/agent.js \"Quote a $10k policy\"");
    return;
  }

  const decision = await decideAction(userInput);
  if (decision.action === "handoff") {
    console.log(decision.reply || "Handing off to a human specialist.");
    return;
  }

  const client = await connectMcpClient();
  const result = await callTool(client, decision.action, decision.args || {});
  const toolOutput = result?.content?.[0]?.text || "{}";

  console.log(JSON.stringify({ decision, toolOutput: JSON.parse(toolOutput) }, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
