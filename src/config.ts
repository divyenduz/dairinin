import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { Client as MCPClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface MCPServer {
  command: string;
  args: string[];
}

export interface Config {
  mcpServers: Record<string, MCPServer>;
}

const DEFAULT_CONFIG: Config = {
  mcpServers: {},
};

export async function loadConfig(): Promise<Config> {
  const configPath = path.join(process.cwd(), ".dairinin.json");

  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, "utf8");
      return JSON.parse(configData) as Config;
    }
  } catch (error) {
    console.error(`Error loading config: ${error}`);
  }

  return DEFAULT_CONFIG;
}

export async function discoverMCPFunctions(mcpServer: MCPServer) {
  const { command, args } = mcpServer;

  const transport = new StdioClientTransport({
    command,
    args,
  });

  const client = new MCPClient({
    name: "dairinin-mcp-client",
    version: "0.0.1",
  });
  await client.connect(transport);

  const { tools } = await client.listTools();

  return {
    tools,
  };
}
