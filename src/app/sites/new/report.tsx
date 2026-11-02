import type { ReportSection } from "./report-model";

export function CompatibilityReport({ sections }: { sections: ReportSection[] }) {
  return (
    <section className="mt-8 border border-[var(--line)] bg-white p-6" aria-label="Compatibility report">
      <h2 className="font-serif text-3xl text-[var(--ink)]">Compatibility</h2>
      <ul className="mt-6 flex flex-col gap-4">
        {sections.map((section) => (
          <li key={section.id} className="border-t border-[var(--line)] pt-4 first:border-t-0 first:pt-0">
            <p className="text-sm text-[var(--ink)]">{section.title}</p>
            <p className="text-sm text-[var(--ink)]">{section.status === "pass" ? "Pass" : "Fail"}</p>
            <p className="text-sm text-[var(--ink)]">{section.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
