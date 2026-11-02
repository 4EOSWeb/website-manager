import type { InputHTMLAttributes, ReactNode } from "react";

type ProductFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
};

export function ProductField({ label, hint, error, id, ...props }: ProductFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <label className="product-field" htmlFor={id}>
      {label}
      <input {...props} id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} />
      {error ? <span id={`${id}-error`} role="alert">{error}</span> : hint ? <span id={`${id}-hint`}>{hint}</span> : null}
    </label>
  );
}
