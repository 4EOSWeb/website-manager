import type { Metadata } from "next";
import { PageCanvas } from "@/components/site/flow-section";
import { readEditorPage } from "@/lib/editor-site";

export const metadata: Metadata = {
  title: "Home",
  description: "Senior care marketing and strategy.",
};

export default function HomePage() {
  const page = readEditorPage("/");
  if (!page || page.archived) return null;
  return <PageCanvas page={page} />;
}
