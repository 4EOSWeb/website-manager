"use client";

export { adapterPathOnboarding, contentPathOnboarding, mediaPathOnboarding, themeSourceOnboarding } from "./path-rules";

function PathField(props: { label: string; value: string; placeholder: string; error: string; onChange: (value: string) => void }) {
  return (
    <>
      <label className="block text-sm text-[var(--ink)]">
        {props.label}
        <input
          className="mt-2 w-full border border-[var(--line)] px-3 py-2"
          value={props.value}
          placeholder={props.placeholder}
          autoCapitalize="none"
          spellCheck={false}
          onChange={(event) => props.onChange(event.target.value)}
        />
      </label>
      {props.error ? <p className="text-sm text-[var(--accent)]" role="alert">{props.error}</p> : null}
    </>
  );
}

export function PathFields(props: {
  adapterPath: string;
  adapterError: string;
  onAdapterPath: (value: string) => void;
  contentPath: string;
  contentError: string;
  onContentPath: (value: string) => void;
  mediaPath: string;
  mediaError: string;
  onMediaPath: (value: string) => void;
  themeSource: string;
  themeError: string;
  onThemeSource: (value: string) => void;
}) {
  return (
    <>
      <PathField label="Adapter path" value={props.adapterPath} placeholder="adapter.ts" error={props.adapterError} onChange={props.onAdapterPath} />
      <PathField label="Content path" value={props.contentPath} placeholder="src/content" error={props.contentError} onChange={props.onContentPath} />
      <PathField label="Media path" value={props.mediaPath} placeholder="public/media" error={props.mediaError} onChange={props.onMediaPath} />
      <PathField label="Theme source" value={props.themeSource} placeholder="adapter" error={props.themeError} onChange={props.onThemeSource} />
    </>
  );
}
