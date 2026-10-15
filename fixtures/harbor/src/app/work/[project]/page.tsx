import { notFound } from "next/navigation";
import { HarborNav } from "@/components/harbor-nav";

const projects: Record<string, { title: string; year: string; place: string }> = {
  "north-pier": { title: "North Pier", year: "2022", place: "Port City" },
  "salt-room": { title: "Salt Room", year: "2023", place: "Dune Road" },
  "lantern-walk": { title: "Lantern Walk", year: "2024", place: "East Jetty" },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(projects).map((project) => ({ project }));
}

export default async function ProjectPage({ params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  const item = projects[project];
  if (!item) notFound();
  return (
    <main>
      <HarborNav />
      <h1>{item.title}</h1>
      <p>
        {item.year} · {item.place}
      </p>
    </main>
  );
}
