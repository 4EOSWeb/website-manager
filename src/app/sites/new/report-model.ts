import { redact } from "@/lib/redact";

export const reportSectionIds = ["connection", "adapter", "routes", "components", "preview", "serialization", "build"] as const;

export type ReportSectionId = (typeof reportSectionIds)[number];

export type ReportSection = {
  id: ReportSectionId;
  title: string;
  status: "pass" | "fail";
  message: string;
};

const titles: Record<ReportSectionId, string> = {
  connection: "Connection",
  adapter: "Adapter",
  routes: "Routes",
  components: "Components",
  preview: "Preview",
  serialization: "Serialization",
  build: "Build",
};

function plain(message: string) {
  const line = redact(message).split(/\r?\n/).map((part) => part.trim()).find((part) => part && !part.startsWith("at "));
  return line || "The check failed.";
}

/** Pass or fail for each check. Messages stay on one line and never include a token. */
export function compatibilityReport(input: Record<ReportSectionId, { ok: boolean; message: string }>): ReportSection[] {
  return reportSectionIds.map((id) => {
    const ok = input[id].ok;
    return {
      id,
      title: titles[id],
      status: ok ? "pass" : "fail",
      message: ok ? "Pass" : plain(input[id].message),
    };
  });
}
