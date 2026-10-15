import { HarborNav } from "@/components/harbor-nav";

export default function HomePage() {
  return (
    <main>
      <HarborNav />
      <section>
        <h1>A coastal studio</h1>
        <p>Harbor & Co. designs rooms, walks, and waterfront places in Port City.</p>
      </section>
      <section aria-label="Selected work">
        <h2>Selected work</h2>
        <ul>
          <li>North Pier</li>
          <li>Salt Room</li>
          <li>Lantern Walk</li>
        </ul>
      </section>
      <section>
        <h2>Visit the shed</h2>
        <p>The studio looks over the water. The north shed is open on weekdays.</p>
      </section>
      <footer>
        <p>Harbor & Co., Port City</p>
      </footer>
    </main>
  );
}
