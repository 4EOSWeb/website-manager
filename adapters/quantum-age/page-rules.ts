/** Reserved addresses for this site. The editor reads this list. */

export const quantumAgePageRules = {
  canCreate: true,
  canDelete: true,
  reservedRoutes: [
    "/",
    "/about",
    "/approach",
    "/solutions",
    "/team",
    "/references",
    "/insights",
    "/contact",
    "/privacy",
    "/terms",
    "/prototype-notes",
  ],
  slugPattern: "/[a-z0-9]+(?:-[a-z0-9]+)*",
};
