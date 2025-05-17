import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, {
    message: "ANTHROPIC_API_KEY is required",
  }),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error(
    "❌ Invalid environment variables:",
    env.error.flatten().fieldErrors
  );
  process.exit(1);
}

export const ENV = env.data;
