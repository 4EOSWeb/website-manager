"use client";

export { adapterPathOnboarding } from "./path-rules";

export function PathFields(props: {
  adapterPath: string;
  adapterError: string;
  onAdapterPath: (value: string) => void;
}) {
  return (
    <>
      <label className="block text-sm text-[var(--ink)]">
        Adapter path
        <input
          className="mt-2 w-full border border-[var(--line)] px-3 py-2"
          value={props.adapterPath}
          placeholder="adapter.ts"
          autoCapitalize="none"
          spellCheck={false}
          onChange={(event) => props.onAdapterPath(event.target.value)}
        />
      </label>
      {props.adapterError ? <p className="text-sm text-[var(--accent)]" role="alert">{props.adapterError}</p> : null}
    </>
  );
}
