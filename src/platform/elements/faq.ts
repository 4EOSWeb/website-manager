import { createElement } from "./create";

/** An FAQ with one question. It does not create a page. */
export function createFaq() {
  return createElement("faq", "generic.faq", { items: [{ q: "Question", a: "Answer" }] });
}
