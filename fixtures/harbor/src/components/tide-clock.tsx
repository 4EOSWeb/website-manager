export function TideClock({ label }: { label: string }) {
  return (
    <figure className="harbor-tide-clock" data-tide-clock="true">
      <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#0F3D4C" strokeWidth="4" />
        <path d="M60 60 L60 22" stroke="#E26D5A" strokeWidth="4" />
        <circle cx="60" cy="60" r="4" fill="#0F3D4C" />
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}
