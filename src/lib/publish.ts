import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { recordAudit } from "@/lib/audit";
import type { HomeDraft, BlogDraft } from "@/lib/content-schema";
import { githubAppConfigured } from "@/lib/dev-auth";
import { installationClient, pushBranch } from "@/lib/github";
import { mediaRoot } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { commitAllowedChanges, openPullRequest } from "@/lib/publish-git";
import { ensureWorkspace, writePreviewContent } from "@/lib/workspace";
import type { User, Website } from "@/generated/prisma/client";

const ADAPTER_FILES = [
  "4eos.editor.config.json",
  "4eos.editor.config.ts",
  "src/middleware.ts",
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/insights/page.tsx",
  "src/app/insights/[slug]/page.tsx",
  "src/components/site/hero-content-image.tsx",
  "src/components/site/editor-preview-script.tsx",
  "src/components/site/structured-article.tsx",
  "src/lib/structured-posts.ts",
];

export async function syncDraftToWorkspace(websiteId: string, home: HomeDraft, posts: BlogDraft[]) {
  const dir = await ensureWorkspace(websiteId);
  const files: { relativePath: string; contents: string | Buffer }[] = [
    { relativePath: "src/content/pages/home.json", contents: `${JSON.stringify(home, null, 2)}\n` },
  ];
  for (const post of posts) {
    files.push({
      relativePath: `src/content/blog/${post.slug}.json`,
      contents: `${JSON.stringify(post, null, 2)}\n`,
    });
    if (post.featuredImage?.src) {
      const filename = path.basename(post.featuredImage.src);
      const stored = path.join(mediaRoot(websiteId), filename);
      if (fs.existsSync(stored)) {
        files.push({ relativePath: `public/media/${filename}`, contents: fs.readFileSync(stored) });
      }
    }
  }
  if (home.heroImage.src) {
    const filename = path.basename(home.heroImage.src);
    const stored = path.join(mediaRoot(websiteId), filename);
    if (fs.existsSync(stored)) {
      files.push({ relativePath: `public/media/${filename}`, contents: fs.readFileSync(stored) });
    }
  }
  writePreviewContent(dir, files);
  return dir;
}

export function changeSummary(home: HomeDraft, posts: BlogDraft[]) {
  const lines = [
    `Heading: ${home.tagline}`,
    `Paragraph: ${home.positioning}`,
    `Button: ${home.primaryButton.label} → ${home.primaryButton.href}`,
  ];
  if (home.heroImage.src) {
    lines.push(
      `Image placed ${home.heroImage.placement === "beside-mark" ? "beside the logo" : "with the introduction"}, aligned ${home.heroImage.align}.`,
    );
  }
  for (const post of posts) lines.push(`Insights draft: ${post.title}`);
  return lines.join("\n");
}

export async function submitForPublish(options: {
  user: User;
  website: Website;
  home: HomeDraft;
  posts: BlogDraft[];
}) {
  const dir = await syncDraftToWorkspace(options.website.id, options.home, options.posts);
  const slug = options.website.githubRepository.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "site";
  const branch = `editor/${slug}/${randomBytes(4).toString("hex")}`;
  const files = [
    ...ADAPTER_FILES,
    "src/content/pages/home.json",
    ...options.posts.map((post) => `src/content/blog/${post.slug}.json`),
  ];
  if (options.home.heroImage.src) files.push(`public/media/${path.basename(options.home.heroImage.src)}`);
  for (const post of options.posts) {
    if (post.featuredImage?.src) files.push(`public/media/${path.basename(post.featuredImage.src)}`);
  }
  const committed = await commitAllowedChanges({
    cwd: dir,
    branch,
    files,
    message: "Update approved website content",
  });
  let status: "AWAITING_REVIEW" | "SAVED_LOCALLY" | "PUBLICATION_FAILED" = "SAVED_LOCALLY";
  let pullRequestUrl: string | null = null;
  let summary = changeSummary(options.home, options.posts);
  if (!committed.commitSha) {
    summary = "Nothing new to send. The live website is unchanged.";
  } else if (githubAppConfigured() && options.website.githubInstallationId) {
    try {
      await pushBranch({
        cwd: dir,
        installationId: options.website.githubInstallationId,
        owner: options.website.githubOwner,
        repo: options.website.githubRepository,
        branch,
      });
      const client = await installationClient(options.website.githubInstallationId);
      const pull = await openPullRequest(client, {
        owner: options.website.githubOwner,
        repo: options.website.githubRepository,
        title: `Website edits for ${options.website.name}`,
        body: summary,
        head: branch,
        base: options.website.defaultBranch,
      });
      pullRequestUrl = pull.url;
      status = "AWAITING_REVIEW";
      summary = `${summary}\n\nA 4EOS reviewer can approve these changes. The live website is unchanged until that review is merged.`;
    } catch (error) {
      status = "PUBLICATION_FAILED";
      summary = error instanceof Error ? error.message : "The review could not be opened.";
    }
  } else {
    summary = `${summary}\n\nThe changes are saved on editing branch ${branch}. They were not sent to GitHub because the GitHub App is not connected yet. The live website is unchanged.`;
  }
  const request = await prisma.publishingRequest.create({
    data: {
      id: `pub_${randomBytes(6).toString("hex")}`,
      websiteId: options.website.id,
      requestedById: options.user.id,
      branchName: branch,
      commitSha: committed.commitSha,
      pullRequestUrl,
      status,
      summary,
    },
  });
  await recordAudit({
    websiteId: options.website.id,
    userId: options.user.id,
    action: "publish.request",
    target: branch,
    metadata: { status, pullRequestUrl, commitSha: committed.commitSha },
  });
  return request;
}
