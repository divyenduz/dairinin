import { LocalContext } from './context';

export async function getUserInput(context: LocalContext): Promise<string> {
  return new Promise((resolve) => {
    const readline = require('readline');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('\nYou: ', (input: string) => {
      rl.close();
      resolve(input.trim());
    });
  });
}
