export type DashboardAction = {
  id: "edit" | "pages" | "media" | "review";
  label: string;
  detail: string;
  href: string;
};

export function dashboardActions(websiteId: string, supportsReviewPublishing: boolean): DashboardAction[] {
  const href = `/sites/${websiteId}/editor`;
  const actions: DashboardAction[] = [
    { id: "edit", label: "Edit", detail: "Open the editor.", href },
    { id: "pages", label: "Pages", detail: "Pages on this site.", href },
    { id: "media", label: "Media", detail: "Pictures on this site.", href },
  ];
  if (supportsReviewPublishing) {
    actions.push({ id: "review", label: "Review", detail: "Review a draft before it is published.", href });
  }
  return actions;
}
