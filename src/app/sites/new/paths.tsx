"use client";

import { ProductField } from "@/components/product/field";

export { adapterPathOnboarding, contentPathOnboarding, mediaPathOnboarding, navigationSourceOnboarding, themeSourceOnboarding } from "./path-rules";

function PathField(props: { id: string; label: string; value: string; placeholder: string; error: string; onChange: (value: string) => void }) {
  return (
    <ProductField
      id={props.id}
      label={props.label}
      value={props.value}
      placeholder={props.placeholder}
      error={props.error || undefined}
      autoCapitalize="none"
      spellCheck={false}
      onChange={(event) => props.onChange(event.target.value)}
    />
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
  navigationSource: string;
  navigationError: string;
  onNavigationSource: (value: string) => void;
}) {
  return (
    <>
      <PathField id="adapter-path" label="Adapter path" value={props.adapterPath} placeholder="adapter.ts" error={props.adapterError} onChange={props.onAdapterPath} />
      <PathField id="content-path" label="Content path" value={props.contentPath} placeholder="src/content" error={props.contentError} onChange={props.onContentPath} />
      <PathField id="media-path" label="Media path" value={props.mediaPath} placeholder="public/media" error={props.mediaError} onChange={props.onMediaPath} />
      <PathField id="theme-source" label="Theme source" value={props.themeSource} placeholder="adapter" error={props.themeError} onChange={props.onThemeSource} />
      <label className="product-field" htmlFor="navigation-source">
        Navigation source
        <select
          id="navigation-source"
          value={props.navigationSource}
          aria-invalid={props.navigationError ? true : undefined}
          aria-describedby={props.navigationError ? "navigation-source-error" : undefined}
          onChange={(event) => props.onNavigationSource(event.target.value)}
        >
          <option value="document">Document</option>
          <option value="adapter">Adapter</option>
        </select>
        {props.navigationError ? (
          <span id="navigation-source-error" role="alert">
            {props.navigationError}
          </span>
        ) : null}
      </label>
    </>
  );
}
