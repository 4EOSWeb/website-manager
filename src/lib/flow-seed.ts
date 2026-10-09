import type { FlowBlock, PageDocument, Section, SiteChrome, SiteDraft } from "./content-schema";

function rich(text: string) {
  return { text, marks: [] as [] };
}

function block(id: string, kind: FlowBlock["kind"], text: string, extra: Partial<FlowBlock> = {}): FlowBlock {
  return { id, kind, hidden: false, text: rich(text), ...extra };
}

export function defaultChrome(): SiteChrome {
  return {
    header: {
      logo: "",
      siteName: "Quantum Age",
      buttonLabel: "Start a conversation",
      buttonHref: "/contact",
      sticky: true,
      social: [],
      hiddenOn: [],
      phoneCompact: true,
    },
    footer: {
      copyright: "© 2026 Quantum Age Collaborative. All rights reserved.",
      note: "The only marketing firm in senior care steeped in both consumer and business-to-business.",
      links: [
        { label: "About", href: "/about" },
        { label: "Team", href: "/team" },
        { label: "Approach", href: "/approach" },
        { label: "References", href: "/references" },
        { label: "Contact", href: "/contact" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Use", href: "/terms" },
      ],
      contact: ["440.638.6990", "askQA@quantum-age.com", "PO Box 360727, Cleveland, OH 44136"],
      social: [],
      images: [],
    },
    announcement: { enabled: false, text: "", href: "" },
    profile: {
      name: "Quantum Age Collaborative",
      phone: "440.638.6990",
      email: "askQA@quantum-age.com",
      address: "PO Box 360727, Cleveland, OH 44136",
    },
    theme: {
      ink: "#231a25",
      plum: "#70456e",
      green: "#3d5f12",
      paper: "#f7f5f0",
      font: "serif",
      button: "filled",
      spacing: "comfortable",
    },
    favicon: "",
    cookieText: "This site uses cookies so it can remember a visit. You can keep browsing either way.",
    analyticsId: "",
  };
}

function flow(id: string, layout: NonNullable<Section["layout"]>, name: string, blocks: FlowBlock[]): Section {
  return { id, type: "flow", hidden: false, editorName: name, layout, blocks };
}

export function homeSections(): Section[] {
  return [
    flow("hero", "hero", "Hero", [
      block("blk_eyebrow", "eyebrow", "Senior Care Marketing & Strategy Experts"),
      block("blk_tagline", "heading", "Elevate strategy. Accelerate growth."),
      block("blk_positioning", "paragraph", "The only marketing firm in senior care steeped in both consumer and business-to-business."),
      block("blk_talk", "button", "Talk with us", { href: "/contact" }),
      block("blk_explore", "button", "Explore solutions", { href: "/solutions" }),
      block("blk_rings", "brand-mark", "Rings", { locked: true, editorName: "Rings" }),
    ]),
    flow("audience", "band", "Who we work with", [
      block("blk_audience_h", "eyebrow", "Who we work with"),
      block("blk_aud_1", "link", "Senior living and aging services", { href: "/about" }),
      block("blk_aud_2", "link", "Healthcare organizations", { href: "/about" }),
      block("blk_aud_3", "link", "Health technology companies", { href: "/about" }),
      block("blk_aud_4", "link", "Wellness and longevity providers", { href: "/about" }),
    ]),
    flow("who", "split", "Who we are", [
      block("blk_who_eye", "eyebrow", "Who we are"),
      block("blk_who_h", "heading", "An agile, responsive ally — an extension of your team"),
      block("blk_who_p", "paragraph", "Quantum Age Collaborative mobilizes leading experts to help healthcare organizations focused on growth achieve their goals."),
      block("blk_who_c", "paragraph", "Decades of health/senior care insight and marketing expertise make Quantum Age an agile and responsive ally – an extension of your team, assuring rightsized support for faster results."),
      block("blk_who_link", "link", "More about Quantum Age", { href: "/about" }),
      block("blk_ben_1", "card", "Access leading experts", { detail: rich("Get access to the very best experts in healthcare without fixed costs") }),
      block("blk_ben_2", "card", "Faster results", { detail: rich("See results faster thanks to decades of experience") }),
      block("blk_ben_3", "card", "Metric-driven", { detail: rich("Be metric driven from day one") }),
    ]),
    flow("solutions", "list", "Solutions", [
      block("blk_sol_eye", "eyebrow", "What we do"),
      block("blk_sol_h", "heading", "Six solution areas, one collaborative team"),
      block("blk_sol_b", "paragraph", "Comprehensive marketing solutions for healthcare organizations, combined around what you need now."),
      block("blk_sol_link", "link", "All solutions and capabilities", { href: "/solutions" }),
      block("blk_sol_1", "card", "Strategize & Launch", { href: "/solutions#strategize", detail: rich("Convert ideas to actions and execute faster. Generate revenue sooner.") }),
      block("blk_sol_2", "card", "Build Awareness", { href: "/solutions#awareness", detail: rich("Go from risky and unknown to renown and famous.") }),
      block("blk_sol_3", "card", "Be a Thought Leader", { href: "/solutions#thought-leadership", detail: rich("Become a respected resource and earn trust—and/or business—for life.") }),
      block("blk_sol_4", "card", "Perform", { href: "/solutions#perform", detail: rich("Challenge, optimize, and energize your operations.") }),
      block("blk_sol_5", "card", "Network", { href: "/solutions#network", detail: rich("Find the right people, gather them, energize them, and motivate action.") }),
      block("blk_sol_6", "card", "Generate Business", { href: "/solutions#generate", detail: rich("Target the right buyers, right messages, right campaigns, at the right time.") }),
    ]),
    flow("formula", "cards", "Formula", [
      block("blk_for_eye", "eyebrow", "The Collaborative Approach"),
      block("blk_for_h", "heading", "Your success is our formula"),
      block("blk_for_1", "card", "You", { detail: rich("Your vision & goals") }),
      block("blk_for_2", "card", "Team", { detail: rich("Expert collaboration") }),
      block("blk_for_3", "card", "Market", { detail: rich("Deep insights") }),
      block("blk_for_4", "card", "Opportunity", { detail: rich("Strategic timing") }),
      block("blk_for_5", "card", "Success", { detail: rich("Measurable results") }),
    ]),
    flow("team", "cards", "Team", [
      block("blk_team_eye", "eyebrow", "The team"),
      block("blk_team_h", "heading", "Experts in senior care marketing"),
      block("blk_team_b", "paragraph", "Our collaborative team brings together experts with 20-35+ years of experience in healthcare marketing, senior living operations, content development, technology, and strategic advisory."),
      block("blk_team_link", "link", "Meet all nine", { href: "/team" }),
      ...["CC Andrews", "Edie Deane", "Tanya Hartsoe", "Wendy Bullard", "Louis Lenzmeier", "Joe Whitt", "Joanne Kaldy", "Jaret Andrews", "Meg LaPorte"].map((name, index) =>
        block(`blk_person_${index + 1}`, "person", name, { href: "/team" }),
      ),
    ]),
    flow("references", "quotes", "References", [
      block("blk_ref_h", "heading", "What our clients say"),
      block("blk_ref_1", "quote", "Quantum Age brings deep expertise and strategic thinking to every engagement. Their collaborative approach made all the difference.", {
        detail: rich("Scott Brown, Director"),
      }),
      block("blk_ref_2", "quote", "Working with Quantum Age transformed our marketing approach. They understand senior care like no other agency.", {
        detail: rich("Margaret McConnell, Chairperson"),
      }),
    ]),
    flow("insights", "insights", "Insights", [
      block("blk_ins_h", "heading", "Writing on senior care, aging services and B2B marketing"),
      block("blk_ins_sum", "insights", "Latest insights", { href: "/insights" }),
    ]),
    flow("cta", "cta", "Call to action", [
      block("blk_cta_h", "heading", "Ready to accelerate your growth?"),
      block("blk_cta_b", "paragraph", "Let's collaborate to elevate your strategy and achieve measurable results."),
      block("blk_cta_btn", "button", "Start a conversation", { href: "/contact" }),
    ]),
  ];
}

function page(input: Omit<PageDocument, "seoTitle" | "metaDescription" | "archived" | "locked"> & Partial<PageDocument>): PageDocument {
  return { seoTitle: input.title, metaDescription: "", archived: false, locked: false, ...input };
}

export function marketingSections(route: string): Section[] | null {
  if (route === "/about") {
    return [
      flow("about_hero", "hero", "About hero", [
        block("about_eye", "eyebrow", "About Quantum Age Collaborative"),
        block("about_h", "heading", "Build. Grow. Achieve. Maximize. Influence."),
        block("about_lead", "paragraph", "Mobilizing leading experts to help healthcare organizations focused on growth achieve their goals."),
      ]),
      flow("about_who", "split", "Who we are", [
        block("about_who_eye", "eyebrow", "Who we are"),
        block("about_who_h", "heading", "Leading experts, mobilized around your goals"),
        block("about_who_p", "paragraph", "Quantum Age Collaborative mobilizes leading experts to help healthcare organizations focused on growth achieve their goals."),
        block("about_who_p2", "paragraph", "We bring deep expertise in healthcare and aging services—understanding the channels, challenges, and changes that make this sector unique."),
      ]),
    ];
  }
  if (route === "/approach") {
    return [
      flow("approach_hero", "hero", "Approach hero", [
        block("approach_h", "heading", "Helping you achieve your goals."),
        block("approach_lead", "paragraph", "We collaborate with you to understand your goals, prioritize what matters most, and deliver measurable results that move your organization forward."),
      ]),
    ];
  }
  if (route === "/solutions") {
    return [
      flow("solutions_hero", "hero", "Solutions hero", [
        block("solutions_h", "heading", "Comprehensive marketing solutions, tailored to your goals"),
        block("solutions_lead", "paragraph", "Six solution areas for healthcare and senior care organizations. Flexible solutions that meet you where you are, from launching something new to getting more from what you already have."),
      ]),
      homeSections().find((section) => section.id === "solutions") ?? flow("solutions_list", "list", "Solutions", []),
    ];
  }
  if (route === "/team") {
    return [
      flow("team_hero", "hero", "Team hero", [
        block("team_h", "heading", "Experts in senior care marketing"),
        block("team_lead", "paragraph", "Our collaborative team brings together experts with 20-35+ years of experience in healthcare marketing, senior living operations, content development, technology, and strategic advisory."),
      ]),
      homeSections().find((section) => section.id === "team") ?? flow("team_list", "cards", "Team", []),
    ];
  }
  if (route === "/references") {
    return [
      flow("references_hero", "hero", "References hero", [
        block("references_h", "heading", "Trusted by leading healthcare organizations"),
        block("references_lead", "paragraph", "What clients have said about working with us, and the kinds of organizations we serve."),
      ]),
      homeSections().find((section) => section.id === "references") ?? flow("references_list", "quotes", "References", []),
    ];
  }
  if (route === "/insights") {
    return [
      flow("insights_hero", "hero", "Insights hero", [
        block("insights_eye", "eyebrow", "Insights"),
        block("insights_h", "heading", "Insights that drive growth"),
        block("insights_lead", "paragraph", "Market intelligence, strategic playbooks, and proven tactics for the longevity economy."),
      ]),
      flow("insights_featured", "insights", "Featured", [block("insights_sum", "insights", "Featured", { href: "/insights" })]),
      flow("insights_cta", "cta", "Insights close", [
        block("insights_cta_h", "heading", "Want to talk through an idea from the archive?"),
        block("insights_cta_b", "paragraph", "Ready to accelerate your growth in the longevity economy? We're here to help."),
        block("insights_cta_btn", "button", "Start a conversation", { href: "/contact" }),
      ]),
    ];
  }
  if (route === "/contact") {
    return [
      flow("contact_hero", "hero", "Contact hero", [
        block("contact_h", "heading", "Let's collaborate"),
        block("contact_lead", "paragraph", "Helping you thrive in the longevity economy like never before. Ready to accelerate your growth? We're here to help."),
      ]),
      flow("contact_details", "stack", "Contact details", [
        block("contact_phone", "link", "440.638.6990", { href: "tel:+14406386990" }),
        block("contact_email", "link", "askQA@quantum-age.com", { href: "mailto:askQA@quantum-age.com" }),
        block("contact_address", "paragraph", "PO Box 360727, Cleveland, OH 44136"),
      ]),
    ];
  }
  return null;
}

export function defaultSiteDocument(): SiteDraft {
  return {
    version: 3,
    chrome: defaultChrome(),
    sectionTemplates: [],
    pages: [
      page({ id: "page_home", route: "/", title: "Home", template: "home", navVisible: true, sections: homeSections() }),
      page({ id: "page_solutions", route: "/solutions", title: "Solutions", template: "marketing", navVisible: true, navLabel: "Solutions", sections: marketingSections("/solutions") ?? [] }),
      page({ id: "page_approach", route: "/approach", title: "Approach", template: "marketing", navVisible: true, navLabel: "Approach", sections: marketingSections("/approach") ?? [] }),
      page({ id: "page_about", route: "/about", title: "About", template: "marketing", navVisible: true, navLabel: "About", sections: marketingSections("/about") ?? [] }),
      page({ id: "page_team", route: "/team", title: "Team", template: "marketing", navVisible: true, navLabel: "Team", sections: marketingSections("/team") ?? [] }),
      page({ id: "page_references", route: "/references", title: "References", template: "marketing", navVisible: true, navLabel: "References", sections: marketingSections("/references") ?? [] }),
      page({ id: "page_insights", route: "/insights", title: "Insights", template: "marketing", navVisible: true, navLabel: "Insights", sections: marketingSections("/insights") ?? [] }),
      page({ id: "page_contact", route: "/contact", title: "Contact", template: "marketing", navVisible: false, sections: marketingSections("/contact") ?? [] }),
      page({ id: "page_privacy", route: "/privacy", title: "Privacy", template: "legal", navVisible: false, locked: true, sections: [] }),
      page({ id: "page_terms", route: "/terms", title: "Terms", template: "legal", navVisible: false, locked: true, sections: [] }),
    ],
  };
}

function textOf(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function presetToFlow(section: Record<string, unknown>): Section {
  const id = String(section.id ?? "section");
  const preset = String(section.preset ?? "stack");
  const fresh = homeSections().find((item) => item.id === id || (item.type === "flow" && item.layout === preset));
  const base = fresh && fresh.type === "flow" ? structuredClone(fresh) : flow(id, "stack", preset, []);
  if (base.type !== "flow") return base;
  base.id = id;
  const heading = textOf(section.heading, "");
  const tagline = textOf(section.tagline, "");
  const positioning = textOf(section.positioning, "");
  const buttonLabel = textOf(section.buttonLabel, "");
  if (tagline) {
    const target = base.blocks.find((item) => item.kind === "heading");
    if (target?.text && typeof target.text === "object") target.text = { ...target.text, text: tagline };
  }
  if (positioning) {
    const target = base.blocks.find((item) => item.kind === "paragraph");
    if (target?.text && typeof target.text === "object") target.text = { ...target.text, text: positioning };
  }
  if (buttonLabel) {
    const target = base.blocks.find((item) => item.kind === "button");
    if (target?.text && typeof target.text === "object") target.text = { ...target.text, text: buttonLabel };
  }
  if (heading) {
    const target = base.blocks.find((item) => item.kind === "heading");
    if (target?.text && typeof target.text === "object" && !tagline) target.text = { ...target.text, text: heading };
  }
  if (typeof section.buttonHref === "string") {
    const target = base.blocks.find((item) => item.kind === "button");
    if (target) target.href = section.buttonHref;
  }
  return { ...base, hidden: Boolean(section.hidden) };
}

export function upgradeDraft(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const record = data as Record<string, unknown>;
  if (record.version === 3 && record.chrome) return record;
  if (!Array.isArray(record.pages)) return data;
  const pages = record.pages.map((page) => {
    if (!page || typeof page !== "object") return page;
    const item = page as Record<string, unknown>;
    const route = String(item.route ?? "");
    const sections = Array.isArray(item.sections) ? item.sections : [];
    const onlyDesigned = sections.length > 0 && sections.every((section) => section && typeof section === "object" && (section as { type?: string }).type === "designed");
    const seeded = marketingSections(route);
    const nextSections = onlyDesigned && seeded
      ? seeded
      : sections
          .map((section) => {
            if (!section || typeof section !== "object") return section;
            const current = section as Record<string, unknown>;
            if (current.type === "preset") return presetToFlow(current);
            if (current.type === "designed") return null;
            return section;
          })
          .filter(Boolean);
    return { ...item, navVisible: route === "/" || item.navVisible === true || ["/solutions", "/approach", "/about", "/team", "/references", "/insights"].includes(route), sections: nextSections };
  });
  return { version: 3, chrome: defaultChrome(), sectionTemplates: record.sectionTemplates ?? [], pages };
}
