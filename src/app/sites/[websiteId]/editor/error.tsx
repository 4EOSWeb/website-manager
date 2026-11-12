"use client";

import { useEffect } from "react";
import { ProductErrorState } from "@/components/product/error-state";

export default function EditorError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <ProductErrorState onRetry={reset} />;
}
