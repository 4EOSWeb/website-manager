# Register a component

Register the description in the site adapter. Leave the React renderer in the site bundle. Do not add a site component to the hub inspector.

Harbor’s tide clock is the example in `fixtures/harbor/registry.ts`:

- id: `harbor.tide-clock`
- name: Tide clock
- category: custom
- props: `label` string, schema id `harbor.tide-clock`
- parents: section, canvas
- inspector: `tide-clock`
- renderer export: `TideClock`

The hub generates fields from the props schema. A custom inspector id is optional.
