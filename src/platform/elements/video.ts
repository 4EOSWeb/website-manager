import type { NodeDocument } from "../document/node";
import { createElement } from "./create";

/** Same address rule the current draft uses for a video section. */
const videoUrl = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=[\w-]+|youtu\.be\/[\w-]+|vimeo\.com\/\d+)$/;

export function acceptVideoUrl(url: string) {
  const value = url.trim();
  return value === "" || videoUrl.test(value);
}

/** A new video. An http address, or any other non-matching address, is not created. */
export function createVideo(url = ""): NodeDocument | null {
  const value = url.trim();
  if (!acceptVideoUrl(value)) return null;
  return createElement("video", "generic.video", { url: value });
}

type VideoTree = {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  children?: VideoTree[];
};

function replaceUrl(node: VideoTree, nodeId: string, url: string): boolean {
  if (node.id === nodeId && node.type === "video") {
    node.props = { ...(node.props ?? {}), url };
    return true;
  }
  return (node.children ?? []).some((child) => replaceUrl(child, nodeId, url));
}

/** Stores a valid video address on one node. An invalid address is not written. */
export function writeVideoUrl(document: unknown, nodeId: string, url: string): unknown | null {
  const value = url.trim();
  if (!acceptVideoUrl(value)) return null;
  if (!document || typeof document !== "object") return null;
  const copy = structuredClone(document) as { pages?: Array<{ root?: VideoTree }> };
  const found = (copy.pages ?? []).some((page) => page.root && replaceUrl(page.root, nodeId, value));
  return found ? copy : null;
}
