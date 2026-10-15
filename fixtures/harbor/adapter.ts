const adapter = {
  version: 1 as const,
  level: 2 as const,
  site: {
    id: "web_harbor",
    name: "Harbor & Co.",
    productionUrl: "https://harbor.example",
    repository: { owner: "harbor", name: "harbor-site" },
    defaultBranch: "main",
  },
  capabilities: {
    supportsPageCreation: true,
    supportsBlog: false,
    supportsNavigationEditing: true,
    supportsFreeCanvas: true,
    supportsStructuredSections: true,
    supportsThemeEditing: true,
    supportsCustomComponents: true,
    supportsForms: false,
    supportsSharedLayouts: true,
    supportsReviewPublishing: false,
  },
  router: { kind: "app" as const, root: "src/app" },
  commands: {
    packageManager: "npm" as const,
    install: "npm install",
    dev: "npm run dev",
    build: "npm run build",
    preview: "npm run start",
  },
  routes: [
    { path: "/", title: "Home" },
    { path: "/work", title: "Work" },
    { path: "/studio", title: "Studio" },
    { path: "/journal", title: "Journal" },
    { path: "/visit", title: "Visit" },
    { path: "/work/:project", title: "Project" },
  ],
  pageRules: {
    canCreate: true,
    canDelete: true,
    reservedRoutes: ["/", "/work", "/studio", "/journal", "/visit"],
    slugPattern: "/[a-z0-9]+(?:-[a-z0-9]+)*",
  },
  pageCapabilities: {
    editMetadata: true,
    editHeader: true,
    editBody: true,
    lockLayout: false,
    lockContent: false,
    providerManaged: false,
  },
  routeCapabilities: {
    "/work/:project": {
      editMetadata: true,
      editHeader: true,
      editBody: true,
      providerManaged: false,
    },
  },
  navigation: {
    source: "adapter" as const,
    editable: true,
    items: [
      { label: "Work", href: "/work" },
      { label: "Studio", href: "/studio" },
      { label: "Journal", href: "/journal" },
      { label: "Visit", href: "/visit" },
    ],
  },
  theme: {
    tokens: [
      { id: "sea", label: "Sea", kind: "color" as const, value: "#0F3D4C" },
      { id: "sand", label: "Sand", kind: "color" as const, value: "#E6D3B1" },
      { id: "coral", label: "Coral", kind: "color" as const, value: "#E26D5A" },
      { id: "foam", label: "Foam", kind: "color" as const, value: "#F7F1E8" },
    ],
  },
  fonts: {
    fonts: [
      { id: "fraunces", family: "Fraunces", category: "serif" as const, source: "file" as const },
      { id: "plex-sans", family: "IBM Plex Sans", category: "sans" as const, source: "file" as const },
    ],
  },
  breakpoints: {
    breakpoints: [
      { id: "desktop" as const, width: 1200, label: "Desktop" },
      { id: "tablet" as const, width: 800, label: "Tablet" },
      { id: "mobile" as const, width: 390, label: "Phone" },
    ],
  },
  components: { components: [] as const },
  templates: { templates: [] as const },
  sharedLayout: { header: "optional" as const, footer: "optional" as const },
  articles: { enabled: false, routePattern: "/journal/:slug", body: "structured" as const },
  media: { storage: "git" as const, publicDir: "public", accept: [".svg" as const, ".png" as const] },
  drafts: {
    scope: ["client", "website", "branch", "page", "user"] as const,
    format: "visual-document-v1" as const,
  },
  preview: { transport: "iframe-postmessage" as const, protocol: 1 as const, readyEvent: "4eos-ready" as const },
  publish: { mode: "disabled" as const, allowlist: [] as string[] },
};

export default adapter;
