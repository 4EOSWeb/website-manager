export function WorkCard(props: { name: string; year: string; place: string }) {
  return (
    <article className="harbor-work-card">
      <h3>{props.name}</h3>
      <p>{props.year}</p>
      <p>{props.place}</p>
    </article>
  );
}

export const harborProjects = [
  { name: "North Pier", year: "2022", place: "Port City" },
  { name: "Salt Room", year: "2023", place: "Dune Road" },
  { name: "Lantern Walk", year: "2024", place: "East Jetty" },
];
