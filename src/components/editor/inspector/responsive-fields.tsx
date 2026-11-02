"use client";

import { Field } from "@/components/editor/ui";
import { InheritanceLabel } from "@/components/editor/inspector/inheritance-label";
import { inheritanceLabelText, type InheritanceNode } from "@/components/editor/inspector/inheritance-text";
import { strategyLabel, strategyNames, strategyValue, type StrategyValue } from "@/components/editor/inspector/responsive-model";
import type { Viewport } from "@/components/editor/types";

/** Strategy, the inheritance label, and the reset for a canvas item. */
export function ResponsiveFields(props: {
  visible: boolean;
  strategy?: StrategyValue;
  breakpoint: Viewport;
  node: InheritanceNode;
  disabled?: boolean;
  onStrategy: (strategy: StrategyValue) => void;
  onReset: () => void;
}) {
  if (!props.visible) return null;
  const label = inheritanceLabelText({ mode: "canvas", breakpoint: props.breakpoint, node: props.node });
  return (
    <div data-responsive-fields="strategy">
      <Field label="Strategy">
        <select
          className="ed-input"
          aria-label="Responsive strategy"
          value={strategyLabel(props.strategy)}
          disabled={props.disabled}
          onChange={(event) => {
            const next = strategyValue(event.target.value);
            if (next) props.onStrategy(next);
          }}
        >
          {strategyNames.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </Field>
      <InheritanceLabel mode="canvas" breakpoint={props.breakpoint} node={props.node} />
      {label === "Custom position" ? (
        <button type="button" className="ed-button" disabled={props.disabled} onClick={props.onReset}>Use inherited position</button>
      ) : null}
    </div>
  );
}
