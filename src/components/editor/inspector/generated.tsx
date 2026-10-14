"use client";

import { useEffect, useState } from "react";
import { inspectorFields } from "@/platform/registry/inspector-fields";
import { validateProps } from "@/platform/registry/props-schema";
import { propsSchemaFor } from "@/platform/elements/props-schemas";
import { Field } from "@/components/editor/ui";
import { colorTokenOptions, designDefinitionFor, generatedName, isContentProp, visibleDesignKeys, type GeneratedNode } from "@/components/editor/inspector/generated-model";
import { inspectorSlot, type RegisteredInspector } from "@/components/editor/inspector/registered-model";
import { FieldError, useFieldIssues } from "@/components/editor/inspector/errors";
import { issuesFromProps, type FieldIssue } from "@/components/editor/inspector/errors-model";
import { formComponent, formControlsVisible, themeControlsVisible } from "@/components/editor/inspector/capability-gate";

/** Name, id, and component for a generic node, plus the descriptors from its props schema. */
const colorKeys = new Set(["color", "background", "border"]);

function labelFor(key: string) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function GeneratedInspector(props: { node: GeneratedNode; tokens?: { id: string; value: string }[]; adapter?: unknown; registered?: RegisteredInspector[]; slots?: Record<string, { label: string }>; experience?: string; onName: (name: string) => void; onProp?: (prop: string, value: string) => void; onStyle?: (key: string, value: string) => void }) {
  const schema = propsSchemaFor(props.node.componentId);
  const generated = schema ? inspectorFields(schema) : { fields: [], warnings: [] };
  const content = generated.fields.filter((field) => isContentProp(field.prop, field.control));
  const rest = generated.fields.filter((field) => !isContentProp(field.prop, field.control));
  const design = designDefinitionFor(props.node.componentId);
  const designKeys = design ? visibleDesignKeys(design) : [];
  const tokens = colorTokenOptions(props.tokens ?? []);
  const themeEditing = themeControlsVisible(props.adapter);
  const showFormFields = !formComponent(props.node.componentId) || formControlsVisible(props.adapter);
  const registered = props.registered?.find((item) => item.componentId === props.node.componentId);
  const slot = inspectorSlot(registered?.customInspectorId, props.slots ?? {}, props.experience ?? "basic");
  const checked = schema ? validateProps({ propsSchema: schema, propsSchemaId: props.node.componentId }, props.node.props) : null;
  const propIssues = checked ? issuesFromProps(checked) : [];
  useFieldIssues(`props:${props.node.id}`, propIssues);
  const stored = generatedName(props.node);
  const issueFor = (path: string): FieldIssue | null => propIssues.find((issue) => issue.path === path) ?? null;
  const [name, setName] = useState(stored);
  useEffect(() => setName(stored), [stored, props.node.id]);
  return (
    <div className="ed-generated" data-generated="common">
      <Field label="Name">
        <input
          className="ed-input"
          aria-label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => {
            if (name !== stored) props.onName(name);
          }}
        />
      </Field>
      <Field label="Id">
        <input className="ed-input" aria-label="Id" value={props.node.id} readOnly />
      </Field>
      <Field label="Component">
        <input className="ed-input" aria-label="Component" value={props.node.componentId} readOnly />
      </Field>
      {content.length > 0 && showFormFields ? (
        <div role="tabpanel" data-generated-tab="content" aria-label="Content">
          <div className="ed-tabs" role="tablist" aria-label="Generated groups">
            <button type="button" role="tab" aria-selected={true}>Content</button>
          </div>
          {content.map((field) => (
            <Field key={field.prop} label={field.label}>
              <input
                className={issueFor(field.prop) ? "ed-input is-invalid" : "ed-input"}
                aria-label={field.label}
                aria-invalid={issueFor(field.prop) ? true : undefined}
                value={String(props.node.props[field.prop] ?? "")}
                data-generated-prop={field.prop}
                onChange={(event) => props.onProp?.(field.prop, event.target.value)}
              />
              <FieldError issue={issueFor(field.prop)} />
            </Field>
          ))}
        </div>
      ) : null}
      {designKeys.length > 0 ? (
        <div role="tabpanel" data-generated-tab="design" aria-label="Design">
          <div className="ed-tabs" role="tablist" aria-label="Generated design">
            <button type="button" role="tab" aria-selected={true}>Design</button>
          </div>
          {designKeys.map((key) => {
            const stored = props.node.styles?.[key] ?? "";
            const tokenId = stored.startsWith("token:") ? stored.slice(6) : "";
            const hex = stored.startsWith("#") ? stored : "";
            const label = labelFor(key);
            return (
              <Field key={key} label={label}>
                {colorKeys.has(key) && themeEditing ? (
                  <>
                    <select
                      className="ed-input"
                      aria-label={`${label} token`}
                      value={tokenId}
                      onChange={(event) => props.onStyle?.(key, event.target.value ? `token:${event.target.value}` : hex)}
                    >
                      <option value="">Custom</option>
                      {tokens.map((id) => <option key={id} value={id}>{id}</option>)}
                    </select>
                    <input className="ed-input" aria-label={`${label} hex`} value={hex} placeholder="#000000" data-generated-style={key} onChange={(event) => props.onStyle?.(key, event.target.value)} />
                  </>
                ) : (
                  <input className="ed-input" aria-label={label} value={stored} data-generated-style={key} onChange={(event) => props.onStyle?.(key, event.target.value)} />
                )}
              </Field>
            );
          })}
        </div>
      ) : null}
      {registered && showFormFields ? (
        <div data-registered-fields={registered.componentId}>
          {registered.fields.map((field) => {
            const stored = props.node.props[field.prop];
            const value = typeof stored === "string" ? stored : "";
            return (
              <Field key={field.prop} label={field.label}>
                <input className={issueFor(field.prop) ? "ed-input is-invalid" : "ed-input"} aria-label={field.label} aria-invalid={issueFor(field.prop) ? true : undefined} value={value} data-generated-prop={field.prop} onChange={(event) => props.onProp?.(field.prop, event.target.value)} />
                <FieldError issue={issueFor(field.prop)} />
              </Field>
            );
          })}
          {slot.status === "ready" && registered.customInspectorId ? <div data-custom-inspector={registered.customInspectorId}>{slot.label}</div> : null}
          {slot.status === "missing" ? <p role="alert">{slot.warning}</p> : null}
        </div>
      ) : null}
      {showFormFields ? rest.map((field) => (
        field.control === "skipped" ? (
          <p key={field.prop} className="ed-hint" data-generated-prop={field.prop}>{field.warning}</p>
        ) : (
          <Field key={field.prop} label={field.label}>
            <input className={issueFor(field.prop) ? "ed-input is-invalid" : "ed-input"} aria-label={field.label} aria-invalid={issueFor(field.prop) ? true : undefined} value={String(props.node.props[field.prop] ?? "")} readOnly data-generated-prop={field.prop} />
            <FieldError issue={issueFor(field.prop)} />
          </Field>
        )
      )) : null}
    </div>
  );
}
