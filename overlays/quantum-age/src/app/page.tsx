import { HomeCanvas } from "@/components/site/home-canvas";
import { readEditorPage } from "@/lib/editor-site";

export default function HomePage() {
  const page = readEditorPage("/");
  if (!page || page.archived) return null;
  return <HomeCanvas page={page} />;
}
