"use client";

import { useEffect, useState } from "react";
import { inspectorFields } from "@/platform/registry/inspector-fields";
import { propsSchemaFor } from "@/platform/elements/props-schemas";
import { Field } from "@/components/editor/ui";
import { generatedName, isContentProp, type GeneratedNode } from "@/components/editor/inspector/generated-model";

/** Name, id, and component for a generic node, plus the descriptors from its props schema. */
export function GeneratedInspector(props: { node: GeneratedNode; onName: (name: string) => void; onProp?: (prop: string, value: string) => void }) {
  const schema = propsSchemaFor(props.node.componentId);
  const generated = schema ? inspectorFields(schema) : { fields: [], warnings: [] };
  const content = generated.fields.filter((field) => isContentProp(field.prop, field.control));
  const rest = generated.fields.filter((field) => !isContentProp(field.prop, field.control));
  const stored = generatedName(props.node);
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
      {content.length > 0 ? (
        <div role="tabpanel" data-generated-tab="content" aria-label="Content">
          <div className="ed-tabs" role="tablist" aria-label="Generated groups">
            <button type="button" role="tab" aria-selected={true}>Content</button>
          </div>
          {content.map((field) => (
            <Field key={field.prop} label={field.label}>
              <input
                className="ed-input"
                aria-label={field.label}
                value={String(props.node.props[field.prop] ?? "")}
                data-generated-prop={field.prop}
                onChange={(event) => props.onProp?.(field.prop, event.target.value)}
              />
            </Field>
          ))}
        </div>
      ) : null}
      {rest.map((field) => (
        field.control === "skipped" ? (
          <p key={field.prop} className="ed-hint" data-generated-prop={field.prop}>{field.warning}</p>
        ) : (
          <Field key={field.prop} label={field.label}>
            <input className="ed-input" aria-label={field.label} value={String(props.node.props[field.prop] ?? "")} readOnly data-generated-prop={field.prop} />
          </Field>
        )
      ))}
    </div>
  );
}
