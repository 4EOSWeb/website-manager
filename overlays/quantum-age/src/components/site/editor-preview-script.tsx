import { canvasScript } from "@/components/site/canvas-script";

export function EditorPreviewScript() {
  if (process.env.EDITOR_PREVIEW !== "1") return null;
  const origin = process.env.EDITOR_HUB_ORIGIN || "http://127.0.0.1:3210";
  return <script dangerouslySetInnerHTML={{ __html: canvasScript(origin) }} />;
}
