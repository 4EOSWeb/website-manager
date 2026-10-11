"use client";

import { useEffect, useRef } from "react";
import type { RichMark } from "@/lib/rich-text";

export type CanvasMessage = Record<string, unknown> & { type: string };

/**
 * A missing website id counts as the active site.
 * The preview does not send one yet. Remove that allowance in step 11.31.
 */
export function messageForSite(message: { websiteId?: unknown }, activeWebsiteId: string): boolean {
  const id = message.websiteId;
  if (typeof id !== "string" || id.length === 0) return true;
  return id === activeWebsiteId;
}

export function nodeIdFromCanvasMessage(message: { type?: unknown; nodeId?: unknown; itemId?: unknown; sectionId?: unknown }): string | null {
  if (message.type !== "4eos-select" && message.type !== "4eos-select-node") return null;
  if (typeof message.nodeId === "string" && message.nodeId) return message.nodeId;
  if (typeof message.itemId === "string" && message.itemId) return message.itemId;
  if (typeof message.sectionId === "string" && message.sectionId) return message.sectionId;
  return null;
}

export function selectionTargetForNode(
  sections: { id: string; blocks?: { id: string }[]; items?: { id: string }[] }[],
  message: { type?: unknown; nodeId?: unknown; itemId?: unknown; sectionId?: unknown },
): { sectionId: string; itemId: string } | null {
  const nodeId = nodeIdFromCanvasMessage(message);
  if (!nodeId) return null;
  if (typeof message.sectionId === "string" && message.sectionId) {
    const itemId = typeof message.itemId === "string" && message.itemId ? message.itemId : nodeId === message.sectionId ? "" : nodeId;
    return { sectionId: message.sectionId, itemId };
  }
  for (const section of sections) {
    if (section.id === nodeId) return { sectionId: section.id, itemId: "" };
    const block = section.blocks?.find((item) => item.id === nodeId);
    if (block) return { sectionId: section.id, itemId: block.id };
    const item = section.items?.find((entry) => entry.id === nodeId);
    if (item) return { sectionId: section.id, itemId: item.id };
  }
  return null;
}

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
export function useCanvasMessages(handle: (message: CanvasMessage, frame: HTMLIFrameElement) => void, activeWebsiteId: string) {
  const handler = useRef(handle);
  const siteId = useRef(activeWebsiteId);
  useEffect(() => {
    handler.current = handle;
    siteId.current = activeWebsiteId;
  });
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const node = previewFrame();
      if (!node || event.source !== node.contentWindow || !event.data || typeof event.data !== "object") return;
      const data = event.data as Record<string, unknown>;
      if (typeof data.type !== "string") return;
      if (!messageForSite(data, siteId.current)) return;
      handler.current(data as CanvasMessage, node);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);
}
