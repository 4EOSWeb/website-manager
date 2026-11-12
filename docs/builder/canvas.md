# Canvas behavior

Canvas coordinates are percentages of the parent, not screen pixels. `src/platform/document/strategy.ts` defines scale, reflow, and custom. A missing smaller breakpoint uses reflow. It does not copy the desktop box. The default strategy is reflow.

A drag starts after the pointer threshold. A drag does not start from a text selection. Snap and guides apply while moving. Z-order is edited on the canvas item. A drop is one undo step.
