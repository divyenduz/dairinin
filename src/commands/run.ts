import { Anthropic } from '@anthropic-ai/sdk';
import { WebSearchTool20250305 } from '@anthropic-ai/sdk/resources';

import { buildCommand } from '@stricli/core';

import chalk from 'chalk';
import dedent from 'dedent';
import invariant from 'tiny-invariant';
import { match } from 'ts-pattern';

import { discoverMCPFunctions, loadConfig } from '@src/config';
import type { LocalContext } from '@src/context';
import { ENV } from '@src/env';
import { getUserInput } from '@src/utils';

type Flags = {
  verbose: boolean;
};

// https://modelcontextprotocol.io/quickstart/client#node
const MODEL_NAME = 'claude-3-7-sonnet-20250219';

const SYSTEM_PROMPT = dedent(`
  You are Dairinin, a helpful AI assistant. 
  You can send briefs of what the user has on their plate by reading their email, calendar, and other sources. 
  
  You can perform these tasks on a schedule or on demand. 
  When users ask for web information like weather. 
  Introduce yourself as Dairinin, not as Claude.`);

type AnthropicTool = (Anthropic.Messages.Tool | WebSearchTool20250305) & {
  executeTool?: Awaited<ReturnType<typeof discoverMCPFunctions>>['executeTool'];
};
type AnthropicToolArray = AnthropicTool[];

export const RunCommand = buildCommand({
  parameters: {
    flags: {
      verbose: {
        kind: 'boolean',
        brief: 'Enable verbose mode',
        default: false,
      },
    },
    aliases: {},
  },
  docs: {
    brief: 'Run an interactive AI agent session',
  },
  async func(flags: Flags, ...args) {
    const { verbose } = flags;
    const context = this as unknown as LocalContext;
    const config = await loadConfig();
    const allTools: AnthropicToolArray = [];

    for (const [serverName, mcpServer] of Object.entries(config.mcpServers)) {
      try {
        const { tools, executeTool } = await discoverMCPFunctions(mcpServer);
        invariant(tools.length !== 0, 'invariant: this MCP server exposes no tools');

        for (const tool of tools) {
          allTools.push({
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema,
            executeTool,
          });
        }

        const toolDisplay = tools
          .slice(0, 3)
          .map((tool) => tool.name)
          .concat('...')
          .join(',');

        console.log(chalk.gray(`(🔌 MCP Server '${serverName}' [${toolDisplay}])`));
      } catch (error) {
        console.error(
          `Failed to connect to MCP server '${serverName}': ${
            mcpServer.command
          } ${mcpServer.args.join(' ')}: ${error}`,
        );
      }
    }

    const anthropic = new Anthropic({
      apiKey: ENV.ANTHROPIC_API_KEY,
    });

    const history: Array<{
      role: 'user' | 'assistant';
      content: string;
    }> = [];

    console.log("🤖 Dairinin AI Assistant started. Type 'exit' to quit.");
    console.log(
      "\nDairinin: Hello! I'm Dairinin, your AI assistant. I can send briefs of what you have on your plate by reading your email, calendar, and other sources. I can do this on a schedule or on demand. How can I help you today?\n",
    );

    while (true) {
      const prompt = await getUserInput(context);

      if (prompt.toLowerCase() === 'exit') {
        console.log('Goodbye! 👋');
        break;
      }

      if (!prompt.trim()) {
        console.log('Please enter a valid message');
        continue;
      }

      history.push({ role: 'user', content: prompt });

      try {
        const result = await anthropic.messages.create({
          model: MODEL_NAME,
          max_tokens: 1000,
          messages: history,
          tools: allTools.concat([
            {
              type: 'web_search_20250305',
              name: 'web_search',
              max_uses: 5,
            },
          ]),
          system: SYSTEM_PROMPT,
        });

        for (const content of result.content) {
          match(content)
            .with({ type: 'thinking' }, (content) => {
              if (verbose) {
                console.error(chalk.gray(`Internal thought: ${JSON.stringify(content, null, 2)}`));
              }
              console.log(chalk.gray('(thinking...)'));
            })
            .with({ type: 'text' }, (content) => {
              const response = content.text.trim();
              console.log(`\nDairinin: ${response}\n`);
              history.push({ role: 'assistant', content: response });
            })
            .with({ type: 'tool_use' }, async (content) => {
              const response = await processToolUse(anthropic, content, allTools, history, flags);
              invariant(response, 'invariant: tool failed to produce a response');
              console.log(`\nDairinin: ${response}\n`);
              history.push({ role: 'assistant', content: response });
            })
            .otherwise((content) => {
              if (verbose) {
                console.error(chalk.gray(`Internal thought: ${content.type}`));
              }
            });
        }
      } catch (error) {
        console.error('Error getting AI response:', error);
      }
    }
  },
});

async function processToolUse(
  anthropic: Anthropic,
  content: Anthropic.Messages.ToolUseBlock,
  allTools: AnthropicToolArray,
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>,
  { verbose }: Flags,
) {
  if (verbose) {
    console.log(chalk.gray(`\nDairinin: [Using tool: ${content.name}]\n`));
  }
  const toolToUse = allTools.find((tool) => tool.name === content.name);
  invariant(
    toolToUse,
    `invariant: couldn't find a tool to use, expected ${content.name} found none`,
  );
  invariant(toolToUse.executeTool, `invariant: expected ${content.name} to have executeTool`);

  // @ts-expect-error fix types of content.input
  const toolResult = await toolToUse.executeTool(content.name, content.input);

  history.push({
    role: 'assistant',
    content: `I will use the tool ${content.name} with id ${
      content.id
    } and following input parameters ${JSON.stringify(content.input, null, 2)}`,
  });

  history.push({
    role: 'user',
    content: `The tool call with id ${
      content.id
    } responded with the following result ${JSON.stringify(
      toolResult || { error: 'Tool execution failed' },
      null,
      2,
    )}`,
  });

  const toolResultResponse = await anthropic.messages.create({
    model: MODEL_NAME,
    max_tokens: 1000,
    messages: history,
    system: SYSTEM_PROMPT,
  });

  toolResultResponse.content.length === 1,
    `invariant: response length of 1 text expected, found ${toolResultResponse.content.length}`;
  if (toolResultResponse.content[0] && 'text' in toolResultResponse.content[0]) {
    const response = toolResultResponse.content[0].text;
    return response.trim();
  } else {
    console.error(
      'Unexpected response format after tool call:',
      JSON.stringify(toolResultResponse.content),
    );
  }
}
