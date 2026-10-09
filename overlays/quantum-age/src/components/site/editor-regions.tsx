import { SectionView } from "@/components/site/section-view";
import { type EditorPage, previewMode, readEditorPage, readSite } from "@/lib/editor-site";
import { headers } from "next/headers";
import { Suspense } from "react";

const LOCK =
  "This item isn't typically editable through the website editor. Please contact your website provider if you need changes made to this section.";

async function requestPath() {
  try {
    return (await headers()).get("x-4eos-path") ?? "";
  } catch {
    return "";
  }
}

const OWN_LAYOUT = new Set(["blank", "landing", "service", "resource", "insights-landing"]);

function needsRegions(page: EditorPage | undefined) {
  if (!page || page.route === "/") return false;
  if (page.sections.some((section) => section.type === "flow") || OWN_LAYOUT.has(page.template ?? "")) return false;
  return Boolean((previewMode && page.locked) || page.archived || page.sections.some((section) => section.type !== "designed"));
}

// Reading request headers in the root layout blocks static prerendering, so the
// public build only does it when some page actually has regions to wrap.
export function EditorRegions({ children }: { children: React.ReactNode }) {
  if (!previewMode && !readSite().pages.some(needsRegions)) return children;
  return (
    <Suspense fallback={null}>
      <Regions>{children}</Regions>
    </Suspense>
  );
}

async function Regions({ children }: { children: React.ReactNode }) {
  const path = await requestPath();
  const page = readEditorPage(path);
  if (!needsRegions(page) || !page) return children;
  if (page.archived && !previewMode) return null;
  if (page.locked) {
    return (
      <div data-locked="provider" data-lock-copy={LOCK}>
        {children}
      </div>
    );
  }
  const designedAt = page.sections.findIndex((section) => section.type === "designed");
  const start = (designedAt === -1 ? [] : page.sections.slice(0, designedAt)).filter((section) => section.type !== "designed");
  const end = (designedAt === -1 ? page.sections : page.sections.slice(designedAt + 1)).filter((section) => section.type !== "designed");
  return (
    <>
      {page.archived && previewMode ? <p className="container-page py-3 text-sm">This page is archived. It stays off the public site until you restore it.</p> : null}
      {start.map((section) => <SectionView key={section.id} section={section} />)}
      {children}
      {end.map((section) => <SectionView key={section.id} section={section} />)}
    </>
  );
}
