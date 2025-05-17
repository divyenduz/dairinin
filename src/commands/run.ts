import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../context";
import { Anthropic } from "@anthropic-ai/sdk";
import { ENV } from "../env";

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

    const anthropic = new Anthropic({
      apiKey: ENV.ANTHROPIC_API_KEY,
    });

    const modelName = "claude-3-7-sonnet-20250219";

    // Initialize conversation history
    const history: Array<{ role: "user" | "assistant"; content: string }> = [];

    console.log(
      `🤖 Dairinin AI Assistant started using ${modelName}. Type 'exit' to quit.`
    );

    console.log(
      "\nDairinin: Hello! I'm Dairinin, your AI assistant. I can send briefs of what you have on your plate by reading your email, calendar, and other sources. I can do this on a schedule or on demand. How can I help you today?\n"
    );

    while (true) {
      const prompt = await getUserInput(context);

      if (prompt.toLowerCase() === "exit") {
        console.log("Goodbye! 👋");
        break;
      }

      if (!prompt.trim() || prompt.toLowerCase() === "thinking...") {
        console.log("Please enter a valid message");
        continue;
      }

      history.push({ role: "user", content: prompt });

      try {
        let response: string;

        console.log("Waiting for response...");
        const result = await anthropic.messages.create({
          model: modelName,
          max_tokens: 1000,
          messages: history,
          system:
            "You are Dairinin, a helpful AI assistant. You can send briefs of what the user has on their plate by reading their email, calendar, and other sources. You can perform these tasks on a schedule or on demand. Introduce yourself as Dairinin, not as Claude.",
        });

        if (result.content[0] && "text" in result.content[0]) {
          response = result.content[0].text;
        } else {
          response = "Unable to generate text response";
          console.error(
            "Unexpected response format:",
            JSON.stringify(result.content)
          );
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
