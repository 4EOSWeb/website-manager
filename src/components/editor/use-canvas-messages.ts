"use client";

import { useEffect, useRef } from "react";
import type { RichMark } from "@/lib/rich-text";

export type CanvasMessage = Record<string, unknown> & { type: string };

const MARK_KINDS = new Set(["bold", "italic", "underline", "link", "color"]);

export function previewFrame() {
  return document.getElementById("site-preview") as HTMLIFrameElement | null;
}

export function toFrame(message: Record<string, unknown>) {
  previewFrame()?.contentWindow?.postMessage(message, "*");
}

/** Keeps only well-formed marks from a canvas message. */
export function readMarks(value: unknown): RichMark[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.flatMap((mark): RichMark[] => {
    if (!mark || typeof mark !== "object") return [];
    const item = mark as { start?: unknown; end?: unknown; kind?: unknown; href?: unknown; color?: unknown };
    if (typeof item.kind !== "string" || !MARK_KINDS.has(item.kind)) return [];
    return [
      {
        start: Number(item.start),
        end: Number(item.end),
        kind: item.kind as RichMark["kind"],
        href: typeof item.href === "string" ? item.href : undefined,
        color: typeof item.color === "string" ? item.color : undefined,
      },
    ];
  });
}

/**
 * Listens for messages from the preview frame only. The handler may change on every render;
 * the listener is attached once and always calls the latest one.
 */
export function useCanvasMessages(handle: (message: CanvasMessage, frame: HTMLIFrameElement) => void) {
  const handler = useRef(handle);
  useEffect(() => {
    handler.current = handle;
  });
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const node = previewFrame();
      if (!node || event.source !== node.contentWindow || !event.data || typeof event.data !== "object") return;
      const data = event.data as Record<string, unknown>;
      if (typeof data.type !== "string") return;
      handler.current(data as CanvasMessage, node);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);
}
