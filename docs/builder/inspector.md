# Generated inspector

The registry props schema drives the fields. A string becomes a text field. A number becomes a number field. An enum becomes a choice. A boolean becomes a toggle.

Basic mode keeps content fields such as label and destination. It hides responsive strategy, z-index, and component ids.

Advanced mode adds exact position, anchors, and z-index. It still hides adapter paths and lock policy.

Administrator mode adds read-only adapter id, component id, lock id, and provider-managed. Client editors do not get those fields.

A custom inspector id is optional. An unknown slot warns an administrator. A capability that is false hides the controls that depend on it. The filter is `src/components/editor/inspector/mode-filter.ts`.
