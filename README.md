# dairinin (だいりにん)

Dairinin is an AI assistant that helps you manage your tasks and provides information through various tools including web search capabilities.

## Setup

### Prerequisites

- [Bun](https://bun.sh) v1.2.10 or higher
- Anthropic API key

### Installation

```bash
# Install dependencies
bun install

# Create a configuration file
cp config-example.json .dairinin.json
```

### Environment Variables

Create a `.env` file with the following variables:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Usage

```bash
# Run the assistant
bun run src/bin/cli.ts

# Enable verbose mode
bun run src/bin/cli.ts --verbose
```

## Configuration

Dairinin uses a `.dairinin.json` configuration file to define available MCP servers. See `config-example.json` for the format:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

## Example Interactions

```
🤖 Dairinin AI Assistant started. Type 'exit' to quit.

Dairinin: Hello! I'm Dairinin, your AI assistant. I can send briefs of what you have on your plate by reading your email, calendar, and other sources. I can do this on a schedule or on demand. How can I help you today?

> What's the weather like today?

Dairinin: Let me check the current weather for you.
[Tool usage occurs in background]

Dairinin: Currently it's 72°F and sunny in your area with a light breeze. The forecast shows clear skies for the rest of the day with temperatures dropping to around 65°F tonight.

> exit
Goodbye! 👋
```

This project was created using `bun init` in bun v1.2.10. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
