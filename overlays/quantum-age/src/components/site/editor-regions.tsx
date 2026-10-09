import { SectionView } from "@/components/site/section-view";
import { previewMode, readEditorPage } from "@/lib/editor-site";
import { headers } from "next/headers";

const LOCK =
  "This item isn't typically editable through the website editor. Please contact your website provider if you need changes made to this section.";

async function requestPath() {
  try {
    return (await headers()).get("x-4eos-path") ?? "";
  } catch {
    return "";
  }
}

export async function EditorRegions({ children }: { children: React.ReactNode }) {
  const path = await requestPath();
  const page = readEditorPage(path);
  if (!page || path === "/" || page.template === "blank" || page.template === "landing" || page.template === "service" || page.template === "resource" || page.template === "insights-landing") {
    return children;
  }
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
