import fs from "fs/promises";
import os from "os";
import path from "path";

import simpleGit from "simple-git";

interface FallbackCommitParams {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  fileName: string;
  fileContent: string;
  commitMessage: string;
  authorName: string;
  authorEmail: string;
}

export async function commitWithGitFallback(params: FallbackCommitParams) {
  const {
    token,
    owner,
    repo,
    branch,
    fileName,
    fileContent,
    commitMessage,
    authorName,
    authorEmail
  } = params;

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "autostreak-"));

  try {
    const remoteUrl = `https://x-access-token:${encodeURIComponent(token)}@github.com/${owner}/${repo}.git`;

    const git = simpleGit();
    try {
      await git.clone(remoteUrl, tempDir, ["--depth", "1", "--branch", branch]);
    } catch {
      // Branch can be missing for empty repos; clone default state and create later.
      await git.clone(remoteUrl, tempDir, ["--depth", "1"]);
    }

    const repoGit = simpleGit(tempDir);
    const filePath = path.join(tempDir, fileName);

    await repoGit.addConfig("user.name", authorName, false, "local");
    await repoGit.addConfig("user.email", authorEmail, false, "local");

    try {
      await repoGit.checkout(branch);
    } catch {
      await repoGit.checkoutLocalBranch(branch);
    }

    await fs.writeFile(filePath, fileContent, "utf8");

    await repoGit.add(fileName);
    await repoGit.commit(commitMessage, undefined, {
      "--author": `${authorName} <${authorEmail}>`
    });
    await repoGit.push("origin", branch);

    const sha = (await repoGit.revparse(["HEAD"]))?.trim();

    return {
      sha,
      branch
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
