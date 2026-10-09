import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { recordAudit } from "@/lib/audit";
import type { BlogDraft, SiteDraft } from "@/lib/content-schema";
import { collectMedia, changeLines } from "@/lib/editor-ops";
import { heroFields } from "@/lib/page-documents";
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
  "src/components/site/canvas-script.ts",
  "src/components/site/structured-article.tsx",
  "src/components/site/editor-regions.tsx",
  "src/components/site/home-canvas.tsx",
  "src/components/site/section-view.tsx",
  "src/components/site/blocks.tsx",
  "src/components/site/nav-links.tsx",
  "src/components/site/mobile-nav.tsx",
  "src/lib/structured-posts.ts",
  "src/lib/editor-site.ts",
  "src/lib/editor-nav.ts",
  "src/app/about/page.tsx",
  "src/app/approach/page.tsx",
  "src/app/solutions/page.tsx",
  "src/app/team/page.tsx",
  "src/app/references/page.tsx",
  "src/app/contact/page.tsx",
  "src/app/search/page.tsx",
  "src/components/site/flow-section.tsx",
  "src/components/site/site-header.tsx",
  "src/components/site/site-footer.tsx",
  "src/app/[slug]/page.tsx",
  "src/content/editor/site.json",
];

function mediaFiles(websiteId: string, names: Set<string>) {
  const files: { relativePath: string; contents: string | Buffer }[] = [];
  for (const filename of names) {
    if (!/^[\w.-]+$/.test(filename)) continue;
    const stored = path.join(mediaRoot(websiteId), filename);
    if (fs.existsSync(stored)) files.push({ relativePath: `public/media/${filename}`, contents: fs.readFileSync(stored) });
  }
  return files;
}

export async function syncDraftToWorkspace(websiteId: string, site: SiteDraft, posts: BlogDraft[]) {
  const dir = await ensureWorkspace(websiteId);
  const home = heroFields(site);
  const names = collectMedia(site);
  for (const post of posts) collectMedia(post, names);
  const files: { relativePath: string; contents: string | Buffer }[] = [
    { relativePath: "src/content/editor/site.json", contents: `${JSON.stringify(site, null, 2)}\n` },
    { relativePath: "src/content/pages/home.json", contents: `${JSON.stringify(home, null, 2)}\n` },
    ...mediaFiles(websiteId, names),
  ];
  for (const post of posts) {
    files.push({
      relativePath: `src/content/blog/${post.slug}.json`,
      contents: `${JSON.stringify(post, null, 2)}\n`,
    });
  }
  writePreviewContent(dir, files);
  return dir;
}

export function changeSummary(site: SiteDraft, posts: BlogDraft[]) {
  return changeLines(site, posts);
}

export async function submitForPublish(options: {
  user: User;
  website: Website;
  site: SiteDraft;
  posts: BlogDraft[];
}) {
  const dir = await syncDraftToWorkspace(options.website.id, options.site, options.posts);
  const slug = options.website.githubRepository.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "site";
  const branch = `editor/${slug}/${randomBytes(4).toString("hex")}`;
  const mediaNames = collectMedia(options.site);
  for (const post of options.posts) collectMedia(post, mediaNames);
  const files = [
    ...ADAPTER_FILES,
    "src/content/pages/home.json",
    ...options.posts.map((post) => `src/content/blog/${post.slug}.json`),
    ...[...mediaNames].filter((filename) => fs.existsSync(path.join(dir, "public", "media", filename))).map((filename) => `public/media/${filename}`),
  ];
  const committed = await commitAllowedChanges({
    cwd: dir,
    branch,
    files,
    message: "Update approved website content",
  });
  let status: "AWAITING_REVIEW" | "SAVED_LOCALLY" | "PUBLICATION_FAILED" = "SAVED_LOCALLY";
  let pullRequestUrl: string | null = null;
  let summary = changeSummary(options.site, options.posts);
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
