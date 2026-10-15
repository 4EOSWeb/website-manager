import { HarborNav } from "@/components/harbor-nav";
import { TideClock } from "@/components/tide-clock";

export default function VisitPage() {
  return (
    <main>
      <HarborNav />
      <h1>Visit the shed</h1>
      <p>Weekdays, north shed, Port City.</p>
      <TideClock label="Tide clock" />
    </main>
  );
}