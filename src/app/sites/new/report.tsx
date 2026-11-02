import type { ReportSection } from "./report-model";

export function CompatibilityReport({ sections }: { sections: ReportSection[] }) {
  return (
    <section className="product-card" aria-label="Compatibility report">
      <h2>Compatibility</h2>
      <ul className="product-sites-list">
        {sections.map((section) => (
          <li key={section.id}>
            <p>{section.title}</p>
            <p>{section.status === "pass" ? "Pass" : "Fail"}</p>
            <p className="product-quiet">{section.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
