import { z } from "zod";

export const frequencySchema = z.enum([
  "DAILY",
  "EVERY_12_HOURS",
  "EVERY_8_HOURS",
  "EVERY_6_HOURS",
  "EVERY_4_HOURS",
  "EVERY_2_HOURS",
  "EVERY_1_HOUR"
]);

export const repoInputSchema = z.object({
  repoUrl: z.string().url().refine((url) => url.includes("github.com"), {
    message: "Must be a valid GitHub repository URL"
  }),
  pat: z.string().min(20, "PAT looks too short"),
  frequency: frequencySchema.default("DAILY"),
  commitMessageTemplate: z.string().min(4).max(120).optional(),
  fileContentTemplate: z.string().min(4).max(2000).optional()
});

export const repoUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
  frequency: frequencySchema.optional(),
  commitMessageTemplate: z.string().min(4).max(120).optional(),
  fileContentTemplate: z.string().min(4).max(2000).optional()
});

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(120)
});

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(120)
});

const repoUrlPattern = /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#]+?)(?:\.git)?\/?$/i;

export function extractOwnerAndRepo(repoUrl: string) {
  const match = repoUrl.trim().match(repoUrlPattern);

  if (!match) {
    throw new Error("Invalid GitHub URL format. Use https://github.com/owner/repo");
  }

  return {
    owner: match[1],
    repo: match[2]
  };
}
