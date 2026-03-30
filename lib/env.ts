import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(16),
  AUTH_TRUST_HOST: z.string().optional(),
  GITHUB_ID: z.string().min(1),
  GITHUB_SECRET: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(16),
  REDIS_URL: z.string().min(1),
  CRON_SECRET: z.string().optional(),
  APP_URL: z.string().url().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed. Check your .env values.");
}

export const env = parsed.data;
