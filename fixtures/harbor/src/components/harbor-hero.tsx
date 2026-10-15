import { HarborTextButton } from "@/components/harbor-button";

export function HarborHero() {
  return (
    <section className="harbor-hero" style={{ position: "relative", minHeight: "22rem", background: "#0F3D4C" }}>
      <img src="/hero.svg" alt="" style={{ display: "block", width: "100%", height: "22rem", objectFit: "cover" }} />
      <div style={{ position: "absolute", left: "1.5rem", bottom: "1.5rem", color: "#F7F1E8" }}>
        <h1 style={{ margin: 0 }}>Harbor & Co.</h1>
        <HarborTextButton href="/visit">Walk down to the shed</HarborTextButton>
      </div>
    </section>
  );
}
