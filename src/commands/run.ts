import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../context";
import { Anthropic } from "@anthropic-ai/sdk";
import dotenv from "dotenv";

export const RunCommand = buildCommand({
  parameters: {
    flags: {},
    aliases: {},
  },
  docs: {
    brief: "Run an interactive AI agent session",
  },
  async func(flags: Record<string, any>, ...args) {
    const context = this as unknown as LocalContext;

    // Load environment variables from .env file
    dotenv.config();

    // Initialize Claude client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "", // Use API key from .env file
    });

    const modelName = "claude-3-7-sonnet-20250219";

    // Initialize conversation history
    const history: Array<{ role: "user" | "assistant"; content: string }> = [];

    console.log(
      `🤖 Dairinin AI Assistant started using ${modelName}. Type 'exit' to quit.`
    );

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log(
        "⚠️ Warning: ANTHROPIC_API_KEY environment variable not set."
      );
      console.log(
        "The assistant will echo your messages instead of using Claude."
      );
    }

    // Simple agentic loop
    while (true) {
      // Get user input from command line
      const prompt = await getUserInput(context);

      if (prompt.toLowerCase() === "exit") {
        console.log("Goodbye! 👋");
        break;
      }

      // Skip empty messages and reserved words
      if (!prompt.trim() || prompt.toLowerCase() === "thinking...") {
        console.log("Please enter a valid message");
        continue;
      }
      
      // Add user message to history
      history.push({ role: "user", content: prompt });

      try {
        let response: string;

        if (process.env.ANTHROPIC_API_KEY) {
          // Send request to Claude API
          console.log("Waiting for response...");
          const result = await anthropic.messages.create({
            model: modelName,
            max_tokens: 1000,
            messages: history,
          });

          // Handle different response types
          if (result.content[0] && "text" in result.content[0]) {
            response = result.content[0].text;
          } else {
            response = "Unable to generate text response";
            console.error("Unexpected response format:", JSON.stringify(result.content));
          }
        } else {
          // Echo mode when API key is not available
          response = `I'm in echo mode (no API key): ${prompt}`;
        }

        console.log(`\nAI: ${response}\n`);

        // Add AI response to history
        history.push({ role: "assistant", content: response });
      } catch (error) {
        console.error("Error getting AI response:", error);
      }
    }
  },
});

// Helper function to get user input
async function getUserInput(context: LocalContext): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write("\nYou: ");

    const chunks: string[] = [];

    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    const onData = (chunk: string) => {
      if (chunk.includes("\n")) {
        const input = [...chunks, chunk].join("").trim();
        chunks.length = 0;

        process.stdin.removeListener("data", onData);
        process.stdin.pause();

        resolve(input);
      } else {
        chunks.push(chunk);
      }
    };

    process.stdin.on("data", onData);
  });
}
