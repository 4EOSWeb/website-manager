const formEntries = new Set(["element:form", "element:input", "element:textarea", "element:select", "element:checkbox"]);

const formComponents = new Set(["generic.form", "generic.input", "generic.textarea", "generic.select", "generic.checkbox"]);

function flag(adapter: unknown, name: "supportsFreeCanvas" | "supportsForms" | "supportsThemeEditing" | "supportsBlog"): boolean {
  if (!adapter || typeof adapter !== "object") return false;
  const capabilities = (adapter as { capabilities?: Record<string, unknown> }).capabilities;
  return capabilities?.[name] === true;
}

/** Canvas position fields and the canvas catalog entry. */
export function canvasControlsVisible(adapter: unknown): boolean {
  return flag(adapter, "supportsFreeCanvas");
}

/** Form catalog entries and generated form fields. */
export function formControlsVisible(adapter: unknown): boolean {
  return flag(adapter, "supportsForms");
}

/** Theme token dropdowns. A custom color can still be typed. */
export function themeControlsVisible(adapter: unknown): boolean {
  return flag(adapter, "supportsThemeEditing");
}

export function formComponent(componentId: string): boolean {
  return formComponents.has(componentId);
}

/** Headings and other entries stay. Canvas and form entries follow the flags. */
export function libraryEntryVisible(entryId: string, adapter: unknown): boolean {
  if (entryId === "element:canvas") return canvasControlsVisible(adapter);
  if (formEntries.has(entryId)) return formControlsVisible(adapter);
  return true;
}

const blogLibrary = new Set(["section:insights-summary", "section:freeform", "section:search"]);

/** Version 3 section entries that belong to a blog stay with sites that publish one. */
export function legacyLibraryVisible(entryId: string, adapter: unknown): boolean {
  if (!blogLibrary.has(entryId)) return true;
  return flag(adapter, "supportsBlog");
}
