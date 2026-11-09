export function ProductLoading({ label }: { label: string }) {
  return (
    <div className="product-loading" role="status" aria-live="polite" aria-label={label}>
      <span className="product-loading-bar" />
      <span className="product-loading-bar" />
      <span className="product-loading-bar" />
      <p>{label}</p>
    </div>
  );
}
