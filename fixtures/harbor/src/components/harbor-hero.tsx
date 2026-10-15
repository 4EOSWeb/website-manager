import Link from "next/link";

export function HarborHero() {
  return (
    <section className="harbor-hero" style={{ position: "relative", minHeight: "22rem", background: "#0F3D4C" }}>
      <img src="/hero.svg" alt="" style={{ display: "block", width: "100%", height: "22rem", objectFit: "cover" }} />
      <div style={{ position: "absolute", left: "1.5rem", bottom: "1.5rem", color: "#F7F1E8" }}>
        <h1 style={{ margin: 0 }}>Harbor & Co.</h1>
        <Link href="/visit">Walk down to the shed</Link>
      </div>
    </section>
  );
}
