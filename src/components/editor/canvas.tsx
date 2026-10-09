"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import type { Zoom } from "@/components/editor/chrome";

export function Canvas(props: { src: string; width: number; zoom: Zoom; title: string; onScale: (scale: number) => void; failed: boolean; onRetry: () => void }) {
  const holder = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [loadedSrc, setLoadedSrc] = useState("");
  if (loadedSrc !== props.src && !loading) setLoading(true);
  const onScale = props.onScale;

  useEffect(() => {
    const node = holder.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setRoom({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const gutter = 48;
  const fit = room.width ? Math.min(1, Math.max(0.25, (room.width - gutter) / props.width)) : 1;
  const scale = props.zoom === "fit" ? fit : props.zoom / 100;
  const frameHeight = Math.max(480, (room.height - 32) / scale);

  useEffect(() => {
    onScale(scale);
  }, [scale, onScale]);

  return (
    <div ref={holder} className={scale > fit + 0.001 ? "ed-canvas is-zoomed" : "ed-canvas"}>
      <div className="ed-frame" style={{ width: props.width * scale, height: frameHeight * scale }}>
        <iframe
          id="site-preview"
          title={props.title}
          sandbox="allow-scripts allow-forms"
          src={props.src}
          style={{ width: props.width, height: frameHeight, transform: `scale(${scale})` }}
          onLoad={() => {
            setLoading(false);
            setLoadedSrc(props.src);
          }}
        />
        {loading && !props.failed ? (
          <div className="ed-frame-state" role="status">
            <LoaderCircle size={18} aria-hidden="true" className="ed-spin" /> Loading the page…
          </div>
        ) : null}
        {props.failed ? (
          <div className="ed-frame-state is-error" role="alert">
            <p>The preview stopped responding. Your changes are saved.</p>
            <button type="button" className="ed-button" onClick={props.onRetry}><RefreshCw size={14} aria-hidden="true" /> Reload preview</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
