"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";

export function IconButton(props: {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean;
  tipSide?: "below" | "right" | "above";
  className?: string;
  children: ReactNode;
}) {
  const tip = props.shortcut ? `${props.label} (${props.shortcut})` : props.label;
  return (
    <button
      type="button"
      className={`ed-icon ${props.className ?? ""}`}
      aria-label={props.label}
      aria-pressed={props.pressed}
      data-tip={tip}
      data-tip-side={props.tipSide ?? "below"}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

export function Group(props: { title: string; children: ReactNode; defaultOpen?: boolean; action?: ReactNode }) {
  const [open, setOpen] = useState(props.defaultOpen ?? true);
  const id = useId();
  return (
    <section className="ed-group">
      <div className="ed-group-head">
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>
          <ChevronDown size={14} aria-hidden="true" className={open ? "" : "-rotate-90"} />
          {props.title}
        </button>
        {props.action}
      </div>
      {open ? (
        <div id={id} className="ed-group-body">
          {props.children}
        </div>
      ) : null}
    </section>
  );
}

export function Field(props: { label: string; hint?: string; children: ReactNode; count?: { value: number; max: number } }) {
  return (
    <label className="ed-field">
      <span className="ed-field-label">
        {props.label}
        {props.count ? (
          <span className={props.count.value > props.count.max ? "ed-count is-over" : "ed-count"}>
            {props.count.value}/{props.count.max}
          </span>
        ) : null}
      </span>
      {props.children}
      {props.hint ? <span className="ed-hint">{props.hint}</span> : null}
    </label>
  );
}

export function TextInput(props: { value: string; onChange: (value: string) => void; placeholder?: string; disabled?: boolean; maxLength?: number; type?: string; list?: string; autoFocus?: boolean }) {
  return (
    <input
      className="ed-input"
      type={props.type ?? "text"}
      value={props.value}
      placeholder={props.placeholder}
      disabled={props.disabled}
      maxLength={props.maxLength}
      list={props.list}
      autoFocus={props.autoFocus}
      onChange={(event) => props.onChange(event.target.value)}
    />
  );
}

export function TextArea(props: { value: string; onChange: (value: string) => void; placeholder?: string; disabled?: boolean; rows?: number; maxLength?: number }) {
  return (
    <textarea
      className="ed-input ed-textarea"
      value={props.value}
      rows={props.rows ?? 3}
      placeholder={props.placeholder}
      disabled={props.disabled}
      maxLength={props.maxLength}
      onChange={(event) => props.onChange(event.target.value)}
    />
  );
}

export function Select<T extends string>(props: { value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void; disabled?: boolean; label?: string }) {
  return (
    <select className="ed-input ed-select" aria-label={props.label} value={props.value} disabled={props.disabled} onChange={(event) => props.onChange(event.target.value as T)}>
      {props.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Segmented<T extends string>(props: {
  label: string;
  value: T | undefined;
  options: readonly { value: T; label: string; icon?: ReactNode }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="ed-segmented" role="radiogroup" aria-label={props.label}>
      {props.options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={props.value === option.value}
          aria-label={option.icon ? option.label : undefined}
          data-tip={option.icon ? option.label : undefined}
          disabled={props.disabled}
          onClick={() => props.onChange(option.value)}
        >
          {option.icon ?? option.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle(props: { label: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean; hint?: string }) {
  return (
    <label className="ed-toggle">
      <span>
        {props.label}
        {props.hint ? <span className="ed-hint">{props.hint}</span> : null}
      </span>
      <input type="checkbox" role="switch" checked={props.checked} disabled={props.disabled} onChange={(event) => props.onChange(event.target.checked)} />
      <span className="ed-switch" aria-hidden="true" />
    </label>
  );
}

export function Swatches(props: { label: string; value: string | undefined; colors: readonly { value: string; name: string }[]; onChange: (value: string | undefined) => void; allowDefault?: boolean; disabled?: boolean }) {
  return (
    <div className="ed-swatches" role="radiogroup" aria-label={props.label}>
      {props.allowDefault ? (
        <button type="button" role="radio" aria-checked={!props.value} className="ed-swatch is-default" data-tip="Default" aria-label="Default" disabled={props.disabled} onClick={() => props.onChange(undefined)} />
      ) : null}
      {props.colors.map((color) => (
        <button
          key={color.value}
          type="button"
          role="radio"
          aria-checked={props.value?.toLowerCase() === color.value.toLowerCase()}
          aria-label={color.name}
          data-tip={color.name}
          className="ed-swatch"
          style={{ background: color.value }}
          disabled={props.disabled}
          onClick={() => props.onChange(color.value)}
        />
      ))}
    </div>
  );
}

export function Dialog(props: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean; description?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(props.onClose);
  useEffect(() => {
    closeRef.current = props.onClose;
  });
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first = node?.querySelector<HTMLElement>("[autofocus], input, select, textarea, button:not([data-close])");
    first?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeRef.current();
      }
      if (event.key === "Tab" && node) {
        const focusable = Array.from(node.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")).filter((item) => !item.hasAttribute("disabled"));
        const head = focusable[0];
        const tail = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === head) {
          event.preventDefault();
          tail?.focus();
        } else if (!event.shiftKey && document.activeElement === tail) {
          event.preventDefault();
          head?.focus();
        }
      }
    }
    node?.addEventListener("keydown", onKey);
    return () => {
      node?.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, []);
  return (
    <div className="ed-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) props.onClose(); }}>
      <div ref={ref} className={props.wide ? "ed-dialog is-wide" : "ed-dialog"} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="ed-dialog-head">
          <div>
            <h2 id={titleId}>{props.title}</h2>
            {props.description ? <p className="ed-hint">{props.description}</p> : null}
          </div>
          <button type="button" className="ed-icon" aria-label="Close" data-close onClick={props.onClose}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="ed-dialog-body">{props.children}</div>
        {props.footer ? <div className="ed-dialog-foot">{props.footer}</div> : null}
      </div>
    </div>
  );
}

export function Empty(props: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="ed-empty">
      <p className="ed-empty-title">{props.title}</p>
      {props.children ? <p>{props.children}</p> : null}
      {props.action}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="ed-kbd">{children}</kbd>;
}
