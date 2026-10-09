import site from "@/content/editor/site.json";
import { primaryNav } from "@/content/site";

type NavPage = {
  title?: string;
  route?: string;
  navVisible?: boolean;
  archived?: boolean;
  locked?: boolean;
  sections?: { type?: string; title?: string; lead?: string; hidden?: boolean }[];
};

export function designedCopy(path: string) {
  const page = ((site as { pages?: NavPage[] }).pages ?? []).find((item) => item.route === path);
  const designed = page?.sections?.find((section) => section.type === "designed");
  if (!designed) return null;
  return { title: designed.title ?? "", lead: designed.lead ?? "", hidden: Boolean(designed.hidden) };
}

export function extraNav(): { label: string; href: string }[] {
  const known = new Set([...primaryNav.map((item) => item.href), "/contact", "/"]);
  const pages = ((site as { pages?: NavPage[] }).pages ?? []).filter(
    (page): page is { title: string; route: string; navVisible?: boolean; archived?: boolean; locked?: boolean } =>
      typeof page.title === "string" && typeof page.route === "string",
  );
  return pages
    .filter((page) => page.navVisible && !page.archived && !page.locked && !known.has(page.route))
    .map((page) => ({ label: page.title, href: page.route }));
}
