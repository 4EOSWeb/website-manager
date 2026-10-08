import manifest from "./4eos.editor.config.json";

/**
 * Approved editor manifest for the Quantum Age test site.
 * The hub reads the JSON file. This module exists so the site repository
 * has an explicit, reviewable manifest and does not need to be executed by the hub.
 */
const editorConfig = manifest;

export default editorConfig;
