# Dairinin Project Guidelines

## Commands

- **Install dependencies**: `bun install`
- **Run the application**: `bun run src/bin/cli.ts`
- **Build/Type-check**: `bun run tsc --noEmit`
- **Format code**: `bun run prettier --write "src/**/*.ts"`

## Code Style Guidelines

- **Defensive Programmig**: use invariant from tiny-invariant a lot to validate that each function is called with correct parameters
- **Imports**: Use named imports. Group imports by external packages first, then internal modules
- **Types**: Use TypeScript strict mode. Prefer interfaces for objects. Use explicit typing
- **Naming**: camelCase for variables/functions, PascalCase for classes/types/interfaces
- **Error Handling**: Use typed errors and proper error propagation
- **Formatting**: 2-space indentation, single quotes for strings
- **Architecture**: Follow the command pattern using @stricli/core
- **Command Structure**: Implement commands using buildCommand with proper documentation
- **Context**: Use LocalContext for command implementations

## Testing

- Run tests with: `bun test`
- Single test file: `bun test path/to/test.ts`
