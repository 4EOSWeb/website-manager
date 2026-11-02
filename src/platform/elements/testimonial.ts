import { createElement } from "./create";

/** A testimonial. The words are placeholders, not a customer quote. */
export function createTestimonial() {
  return createElement("testimonial", "generic.testimonial", { quote: "Quote", name: "Name", role: "Role" });
}
