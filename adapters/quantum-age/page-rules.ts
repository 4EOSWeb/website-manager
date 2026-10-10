/** Reserved addresses are the union of the editor constants. Those constants stay until step 14.10. */

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
