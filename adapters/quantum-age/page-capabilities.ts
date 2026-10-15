/**
 * Page flags for this site. Privacy and terms are locked pages today, and their
 * menu label and search details stay editable. Article regions are not blanket-locked.
 * Surrounding article chrome is step 14.20. Article bodies stay html-preserved.
 */

const editable = {
  editMetadata: true,
  editBody: true,
  lockLayout: false,
  lockContent: false,
  providerManaged: false,
};

const providerPage = {
  editMetadata: true,
  editBody: false,
  lockLayout: true,
  lockContent: true,
  providerManaged: true,
};

export const quantumAgeRouteCapabilities = {
  "/": editable,
  "/solutions": editable,
  "/approach": editable,
  "/about": editable,
  "/team": editable,
  "/references": editable,
  "/insights": editable,
  "/contact": editable,
  "/privacy": providerPage,
  "/terms": providerPage,
  "/insights/:slug": {
    editMetadata: true,
    editHeader: true,
    editBody: true,
    lockLayout: false,
    lockContent: false,
    providerManaged: false,
  },
};

/** Contract field. Per-route flags live in `quantumAgeRouteCapabilities`. */
export const quantumAgePageCapabilities = editable;
