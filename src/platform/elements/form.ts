import { createElement } from "./create";

/** A contact form. The recipient stays empty until someone sets it. */
export function createForm() {
  return createElement("form", "generic.form", {
    nameLabel: "Name",
    emailLabel: "Email",
    messageLabel: "Message",
    buttonLabel: "Send",
    recipient: "",
  });
}

/** The form catalog entry is shown only when the site can use forms. */
export function formEntryVisible(adapter: unknown) {
  if (!adapter || typeof adapter !== "object") return false;
  const capabilities = (adapter as { capabilities?: { supportsForms?: unknown } }).capabilities;
  return capabilities?.supportsForms === true;
}
