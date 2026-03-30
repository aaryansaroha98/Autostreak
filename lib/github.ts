import { Octokit } from "@octokit/rest";

import { extractOwnerAndRepo } from "@/lib/validators";

export function createOctokit(token: string) {
  return new Octokit({
    auth: token,
    userAgent: "AutoStreak/1.0"
  });
}

export async function validateRepoAccess(token: string, repoUrl: string) {
  const { owner, repo } = extractOwnerAndRepo(repoUrl);
  const octokit = createOctokit(token);

  const repoResponse = await octokit.repos.get({ owner, repo });
  const me = await octokit.users.getAuthenticated();
  const canPush =
    typeof repoResponse.data.permissions?.push === "boolean" ? repoResponse.data.permissions.push : null;

  return {
    owner,
    repo,
    defaultBranch: repoResponse.data.default_branch ?? "main",
    private: repoResponse.data.private,
    canPush,
    tokenLogin: me.data.login,
    tokenName: me.data.name ?? me.data.login
  };
}

export async function resolveGitHubAuthor(token: string) {
  const octokit = createOctokit(token);
  const me = await octokit.users.getAuthenticated();

  let email = me.data.email;

  if (!email) {
    try {
      const emails = await octokit.users.listEmailsForAuthenticatedUser();
      email = emails.data.find((item) => item.primary && item.verified)?.email ?? null;
    } catch {
      email = null;
    }
  }

  if (!email) {
    email = `${me.data.id}+${me.data.login}@users.noreply.github.com`;
  }

  return {
    login: me.data.login,
    name: me.data.name ?? me.data.login,
    email
  };
}
