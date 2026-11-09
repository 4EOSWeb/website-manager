export function publishOutcome(status: string | undefined, reviewUrl?: string | null) {
  if (status === "SAVED_LOCALLY") return "Saved for review on this copy. A pull request was not opened.";
  if (status === "AWAITING_REVIEW") return reviewUrl ? `Sent for review. ${reviewUrl}` : "Sent for review.";
  return null;
}

export function publishFailure(message: string | undefined) {
  if (!message || message.includes("\n") || message.length > 280 || /node_modules|Error:/.test(message)) {
    return "The review could not be sent.";
  }
  return message;
}
