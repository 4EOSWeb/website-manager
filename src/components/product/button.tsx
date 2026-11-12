import type { ButtonHTMLAttributes, ReactNode } from "react";

type ProductButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "quiet";
  pending?: boolean;
  children: ReactNode;
};

export function ProductButton({ variant = "primary", pending = false, className, children, disabled, ...props }: ProductButtonProps) {
  const classes = ["product-button", variant === "quiet" ? "product-button-quiet" : "product-button-primary", className].filter(Boolean).join(" ");
  return (
    <button {...props} className={classes} data-state={pending ? "loading" : undefined} aria-busy={pending || undefined} disabled={disabled || pending}>
      {children}
    </button>
  );
}
