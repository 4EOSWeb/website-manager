"use client";

import { useState } from "react";
import { articleConvertVisible, convertPreservedHtml, type ArticleConversion } from "@/platform/articles/convert";

function requestArticleHtml(): Promise<string> {
  const frame = document.getElementById("site-preview") as HTMLIFrameElement | null;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve("");
    }, 2000);
    function onMessage(event: MessageEvent) {
      if (!frame || event.source !== frame.contentWindow || !event.data || typeof event.data !== "object") return;
      const data = event.data as { type?: unknown; html?: unknown };
      if (data.type !== "4eos-article-html") return;
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve(typeof data.html === "string" ? data.html : "");
    }
    window.addEventListener("message", onMessage);
    frame?.contentWindow?.postMessage({ type: "4eos-article-html" }, "*");
  });
}

export function ArticleConvert(props: { experience: string; canAdminister: boolean; websiteId: string }) {
  const [error, setError] = useState("");
  const [result, setResult] = useState<Extract<ArticleConversion, { ok: true }> | null>(null);
  if (!articleConvertVisible(props.experience, props.canAdminister)) return null;

  async function convert() {
    setError("");
    setResult(null);
    try {
      const response = await fetch(`/api/sites/${props.websiteId}/draft-backup`, { method: "POST" });
      const body = (await response.json().catch(() => ({}))) as { backupId?: string; message?: string };
      const backupId = response.ok && typeof body.backupId === "string" ? body.backupId : "";
      const converted = convertPreservedHtml(await requestArticleHtml(), backupId);
      if (!converted.ok) {
        setError(converted.reason);
        return;
      }
      setResult(converted);
    } catch {
      setError("Save a backup before converting this article.");
    }
  }

  return (
    <div data-article-convert="administrator">
      <button type="button" className="ed-button" onClick={() => void convert()}>Convert this article</button>
      {error ? <p className="ed-note" role="alert">{error}</p> : null}
      {result ? (
        <>
          <ul data-converted-nodes>
            {result.nodes.map((node, index) => (
              <li key={`${node.type}-${index}`}>{node.type === "heading" ? `Heading: ${node.text}` : node.text}</li>
            ))}
          </ul>
          <pre data-unmapped-html>{result.metadata.unmappedHtml || "No markup was skipped."}</pre>
          <p data-backup-id={result.backupId}>A backup was saved. Rollback is available from that backup.</p>
        </>
      ) : null}
    </div>
  );
}
