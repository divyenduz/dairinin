import {
  buildApplication,
  buildCommand,
  buildRouteMap,
  numberParser,
} from "@stricli/core";
import packageJson from "../package.json";
import { RunCommand } from "./commands/run";

const CLI_NAME = `dairinin`;

const routes = buildRouteMap({
  routes: {
    run: RunCommand,
  },
  aliases: {},
  defaultCommand: "run",
  docs: {
    brief: `${CLI_NAME} CLI`,
    hideRoute: {},
  },
});

export const app = buildApplication(routes, {
  name: packageJson.name,
  versionInfo: {
    currentVersion: "v0.0.1",
  },
  scanner: {
    caseStyle: "allow-kebab-for-camel",
  },
  documentation: {
    useAliasInUsageLine: true,
  },
});
