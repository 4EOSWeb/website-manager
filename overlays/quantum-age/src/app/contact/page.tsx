import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageCanvas } from "@/components/site/flow-section";
import { previewMode, readEditorPage } from "@/lib/editor-site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const page = readEditorPage("/contact");
  if (!page || page.locked) notFound();
  if (page.archived && !previewMode) notFound();
  return <PageCanvas page={page} />;
}
