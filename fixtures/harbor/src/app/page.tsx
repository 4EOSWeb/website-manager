import { HarborPillButton } from "@/components/harbor-button";
import { harborProjects, WorkCard } from "@/components/work-card";
import { HarborHero } from "@/components/harbor-hero";
import { HarborNav } from "@/components/harbor-nav";

export default function HomePage() {
  return (
    <main>
      <HarborNav />
      <HarborHero />
      <section>
        <h2>A coastal studio</h2>
        <p>Harbor & Co. designs rooms, walks, and waterfront places in Port City.</p>
      </section>
      <section aria-label="Selected work">
        <h2>Selected work</h2>
        <div className="harbor-work-list">
          {harborProjects.map((project) => (
            <WorkCard key={project.name} name={project.name} year={project.year} place={project.place} />
          ))}
        </div>
      </section>
      <section>
        <h2>Visit the shed</h2>
        <p>The studio looks over the water. The north shed is open on weekdays.</p>
        <HarborPillButton href="/visit">Plan a visit</HarborPillButton>
      </section>
      <footer>
        <p>Harbor & Co., Port City</p>
      </footer>
    </main>
  );
}
