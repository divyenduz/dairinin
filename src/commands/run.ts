import { buildCommand } from "@stricli/core";

export const RunCommand = buildCommand({
  parameters: {
    flags: {},
    aliases: {},
  },
  docs: {
    brief: "",
  },
  func(flags, ...args) {},
});
