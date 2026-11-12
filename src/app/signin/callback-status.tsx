"use client";

import { useFormStatus } from "react-dom";
import { ProductButton } from "@/components/product/button";

export function SignInSubmit({ label, variant = "quiet" }: { label: string; variant?: "primary" | "quiet" }) {
  const status = useFormStatus();
  return (
    <ProductButton type="submit" variant={variant} pending={status.pending}>
      {status.pending ? "Signing you in" : label}
    </ProductButton>
  );
}
