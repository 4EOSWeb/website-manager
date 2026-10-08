import type { MembershipRole, PlatformRole } from "@/generated/prisma/client";

export type Action =
  | "view"
  | "edit"
  | "draft.save"
  | "blog.draft"
  | "media.upload"
  | "publish.request"
  | "audit.read"
  | "membership.manage"
  | "repo.connect"
  | "workspace.manage"
  | "restore";

const editor: Action[] = ["view", "edit", "draft.save", "blog.draft", "media.upload"];
const clientAdmin: Action[] = [...editor, "publish.request", "membership.manage"];
const designer: Action[] = [...clientAdmin, "audit.read", "workspace.manage", "restore"];
const superAdmin: Action[] = [...designer, "repo.connect"];

const membershipPermissions: Record<MembershipRole, Action[]> = {
  VIEWER: ["view"],
  CLIENT_EDITOR: editor,
  CLIENT_ADMIN: clientAdmin,
  DESIGNER: designer,
};

export function permissionsFor(platformRole: PlatformRole | null, membershipRole: MembershipRole | null): Action[] {
  if (platformRole === "SUPER_ADMIN") return superAdmin;
  if (platformRole === "DESIGNER" && !membershipRole) return designer;
  if (!membershipRole) return [];
  return membershipPermissions[membershipRole];
}

export function can(actions: Action[], action: Action): boolean {
  return actions.includes(action);
}

export const stepUpActions: Action[] = [
  "publish.request",
  "audit.read",
  "membership.manage",
  "repo.connect",
  "restore",
];

export function needsStepUp(action: Action): boolean {
  return stepUpActions.includes(action);
}

export const STEP_UP_WINDOW_MS = 10 * 60 * 1000;
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export function landingPath(count: number, onlyId?: string) {
  if (count === 1 && onlyId) return `/sites/${onlyId}/editor`;
  return "/sites";
}

export function roleLabel(platformRole: PlatformRole | null, membershipRole: MembershipRole | null): string {
  if (platformRole === "SUPER_ADMIN") return "4EOS administrator";
  if (platformRole === "DESIGNER" || membershipRole === "DESIGNER") return "4EOS designer";
  if (membershipRole === "CLIENT_ADMIN") return "Client administrator";
  if (membershipRole === "CLIENT_EDITOR") return "Editor";
  if (membershipRole === "VIEWER") return "Viewer";
  return "Signed in";
}
