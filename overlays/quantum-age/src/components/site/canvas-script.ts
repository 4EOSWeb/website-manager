import { autoScrollStep, passedThreshold, pressIntent } from "./canvas/gesture";
import { insertionIndex, nudgeBox, sectionDropIndex, snapBox } from "./canvas/targets";
import { placeToolbar } from "./canvas/toolbar-position";
import { clearMarks, hasMark, marksToHtml, toggleMark, validLink } from "./canvas/marks";

const LOCK =
  "This item isn't typically editable through the website editor. Please contact your website provider if you need changes made to this section.";

const COLORS = [
  { value: "#1c1915", name: "Ink" },
  { value: "#5c3d6e", name: "Plum" },
  { value: "#3f6b4a", name: "Green" },
  { value: "#8c4a2f", name: "Copper" },
  { value: "#f7f4ef", name: "Paper" },
  { value: "#ffffff", name: "White" },
];

const ICONS: Record<string, string> = {
  grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
  edit: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  duplicate: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  bold: '<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>',
  italic: '<line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/>',
  underline: '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  unlink: '<path d="M9 17H7A5 5 0 0 1 7 7"/><path d="M15 7h2a5 5 0 0 1 4 8"/><line x1="8" x2="12" y1="12" y2="12"/><line x1="2" x2="22" y1="2" y2="22"/>',
  color: '<path d="M4 20h16"/><path d="m6 16 6-12 6 12"/><path d="M8 12h8"/>',
  clear: '<path d="M4 7V4h16v3"/><path d="M5 20h6"/><path d="M13 4 8 20"/><path d="m15 15 5 5"/><path d="m20 15-5 5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  down: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  template: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><line x1="12" x2="12" y1="7" y2="13"/><line x1="15" x2="9" y1="10" y2="10"/>',
  copy: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  paste: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><path d="M12 11v6"/><path d="m9 14 3 3 3-3"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
  alt: '<path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  forward: '<path d="M8 6l4-4 4 4"/><path d="M12 2v10"/><rect width="16" height="8" x="4" y="14" rx="2"/>',
  backward: '<path d="M8 18l4 4 4-4"/><path d="M12 22V12"/><rect width="16" height="8" x="4" y="2" rx="2"/>',
  open: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
};

const STYLE = `
:root{--eos-accent:#2563eb;--eos-accent-soft:rgba(37,99,235,.55);--eos-ui:#1f2329;--eos-ui-hover:#2f3540;--eos-ui-text:#f3f4f6;--eos-danger:#f87171}
.eos-hover{outline:1px solid var(--eos-accent-soft)!important;outline-offset:-1px}
.eos-selected{outline:2px solid var(--eos-accent)!important;outline-offset:-2px}
[data-item-id].eos-hover,[data-item-id].eos-selected,[data-chrome-field].eos-selected,[data-nav-route].eos-selected{outline-offset:2px}
.eos-locked-hover{outline:1px dashed #8a8f98!important;outline-offset:-1px}
.eos-editing{outline:2px solid var(--eos-accent)!important;outline-offset:3px;background:rgba(37,99,235,.06);cursor:text;caret-color:var(--eos-accent);white-space:pre-line}
.eos-editing:focus{outline:2px solid var(--eos-accent)!important}
[data-hidden=true]{opacity:.5;outline:1px dashed #8a8f98;outline-offset:-1px}
[data-hidden=true]::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(135deg,rgba(138,143,152,.18) 0 2px,transparent 2px 9px);z-index:1}
.eos-drag-source{opacity:.35!important}
body.eos-dragging,body.eos-dragging *{cursor:grabbing!important;user-select:none!important;-webkit-user-select:none!important}
.eos-ui{position:fixed;z-index:2147483000;transform-origin:0 0;font:500 12px/1.2 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--eos-ui-text);letter-spacing:0}
.eos-bar,.eos-fmt{display:flex;align-items:center;gap:2px;padding:3px;background:var(--eos-ui);border-radius:8px;box-shadow:0 6px 20px rgba(15,23,42,.28),0 0 0 1px rgba(255,255,255,.06)}
.eos-ui button{all:unset;box-sizing:border-box;display:inline-grid;place-items:center;min-width:28px;height:28px;padding:0 6px;border-radius:6px;color:var(--eos-ui-text);cursor:pointer;position:relative}
.eos-ui button:hover,.eos-ui button[aria-expanded=true],.eos-ui button[aria-pressed=true]{background:var(--eos-ui-hover)}
.eos-ui button[aria-pressed=true]{color:#93c5fd}
.eos-ui button:focus-visible{outline:2px solid #93c5fd;outline-offset:1px}
.eos-ui button[disabled]{opacity:.4;cursor:default}
.eos-ui svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.eos-ui .eos-grip{cursor:grab}
.eos-ui .eos-chip{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 8px 0 6px;color:#cbd5e1;white-space:nowrap}
.eos-ui .eos-sep{width:1px;height:18px;margin:0 3px;background:rgba(255,255,255,.14)}
.eos-ui [data-tip]:hover::after,.eos-ui [data-tip]:focus-visible::after{content:attr(data-tip);position:absolute;top:calc(100% + 6px);left:50%;transform:translateX(-50%);padding:4px 7px;border-radius:5px;background:#0b0d10;color:#fff;font-size:11px;white-space:nowrap;pointer-events:none;z-index:2}
.eos-ui [data-tip]:hover:not(:focus-visible)::after{animation:eos-tip-in 0s .7s both}
.eos-ui [data-tip][aria-expanded=true]::after{display:none}
@keyframes eos-tip-in{from{visibility:hidden}to{visibility:visible}}
.eos-menu{min-width:208px;padding:4px;background:var(--eos-ui);border-radius:8px;box-shadow:0 12px 32px rgba(15,23,42,.35),0 0 0 1px rgba(255,255,255,.06)}
.eos-menu [role=menuitem]{display:flex;width:100%;justify-content:flex-start;gap:10px;height:32px;padding:0 10px}
.eos-menu [role=menuitem] kbd{margin-left:auto;color:#94a3b8;font:inherit}
.eos-menu [role=menuitem].eos-danger{color:var(--eos-danger)}
.eos-menu [role=separator]{height:1px;margin:4px 6px;background:rgba(255,255,255,.12)}
.eos-fmt input{all:unset;box-sizing:border-box;width:220px;height:28px;padding:0 8px;border-radius:6px;background:#0f1216;color:#fff}
.eos-fmt .eos-swatch{min-width:22px;width:22px;height:22px;padding:0;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)}
.eos-fmt .eos-note{padding:0 8px;color:#fca5a5;white-space:nowrap}
.eos-hint{padding:6px 10px;background:var(--eos-ui);border-radius:6px;color:#fff}
.eos-gap{position:relative;height:0;z-index:30}
.eos-gap .eos-gap-hit{position:absolute;left:0;right:0;top:-12px;height:24px;display:flex;align-items:center;justify-content:center}
.eos-gap .eos-gap-line{position:absolute;left:24px;right:24px;top:50%;height:2px;margin-top:-1px;background:var(--eos-accent);opacity:0;transition:opacity .12s ease}
.eos-gap .eos-add{all:unset;box-sizing:border-box;position:relative;display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 12px 0 8px;border-radius:999px;background:var(--eos-accent);color:#fff;font:600 12px/1 ui-sans-serif,system-ui,sans-serif;cursor:pointer;opacity:0;transform:scale(.96);transition:opacity .12s ease,transform .12s ease;box-shadow:0 4px 12px rgba(37,99,235,.35)}
.eos-gap .eos-add svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round}
.eos-gap .eos-add:focus-visible{outline:2px solid #1e3a8a;outline-offset:2px}
.eos-gap:hover .eos-gap-line,.eos-gap:focus-within .eos-gap-line,.eos-gap.is-near .eos-gap-line{opacity:.55}
.eos-gap:hover .eos-add,.eos-gap:focus-within .eos-add,.eos-gap.is-near .eos-add,.eos-gap.is-empty .eos-add{opacity:1;transform:none}
.eos-gap.is-empty{height:auto;padding:64px 0}.eos-gap.is-empty .eos-gap-hit{position:static;height:auto}
body.eos-dragging .eos-gap .eos-add{opacity:0}
body.eos-dragging .eos-gap .eos-gap-line{opacity:.18}
.eos-gap.is-hot .eos-gap-line{opacity:1!important;height:3px}
.eos-insert-line{position:fixed;z-index:2147482999;background:var(--eos-accent);border-radius:2px;pointer-events:none}
.eos-ghost{position:fixed;z-index:2147483001;pointer-events:none;width:240px;max-height:160px;overflow:hidden;border-radius:8px;background:#fff;box-shadow:0 12px 32px rgba(15,23,42,.3);opacity:.92}
.eos-ghost-label{padding:6px 10px;background:var(--eos-ui);color:#fff;font:600 12px/1.2 ui-sans-serif,system-ui,sans-serif}
.eos-ghost-body{transform-origin:0 0}
.eos-guide{position:absolute;z-index:60;background:#ec4899;pointer-events:none}
.eos-handle{all:unset;position:absolute;z-index:61;width:10px;height:10px;background:#fff;border:2px solid var(--eos-accent);border-radius:2px;box-sizing:border-box}
.eos-nw{left:-6px;top:-6px;cursor:nwse-resize}.eos-ne{right:-6px;top:-6px;cursor:nesw-resize}.eos-sw{left:-6px;bottom:-6px;cursor:nesw-resize}.eos-se{right:-6px;bottom:-6px;cursor:nwse-resize}
.eos-lock{position:absolute;top:8px;left:8px;z-index:40;display:inline-flex;align-items:center;gap:6px;height:22px;max-width:22px;padding:0 5px;overflow:hidden;border-radius:999px;background:rgba(31,35,41,.72);color:#fff;font:600 11px/1 ui-sans-serif,system-ui,sans-serif;white-space:nowrap;transition:max-width .16s ease;pointer-events:none}
.eos-lock svg{flex:none;width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:2.2}
[data-locked=provider]:hover>.eos-lock,.eos-selected>.eos-lock{max-width:180px}
body.eos-grid [data-freeform]{background-image:linear-gradient(to right,rgba(37,99,235,.16) 1px,transparent 1px),linear-gradient(to bottom,rgba(37,99,235,.16) 1px,transparent 1px);background-size:8.33% 40px}
@media (prefers-reduced-motion:reduce){.eos-gap .eos-gap-line,.eos-gap .eos-add,.eos-lock{transition:none}}
`;

function inline(fn: (...args: never[]) => unknown) {
  return "(" + fn.toString() + ")";
}

export function canvasScript(origin: string) {
  return `(function () {
    var origin = ${JSON.stringify(origin)};
    if (location.search.indexOf("clean=1") !== -1 || window.parent === window) return;
    var LOCK = ${JSON.stringify(LOCK)};
    var COLORS = ${JSON.stringify(COLORS)};
    var ICONS = ${JSON.stringify(ICONS)};
    var STYLE = ${JSON.stringify(STYLE)};
    var H = {
      pressIntent: ${inline(pressIntent)},
      passedThreshold: ${inline(passedThreshold)},
      autoScrollStep: ${inline(autoScrollStep)},
      sectionDropIndex: ${inline(sectionDropIndex)},
      insertionIndex: ${inline(insertionIndex)},
      snapBox: ${inline(snapBox)},
      nudgeBox: ${inline(nudgeBox)},
      placeToolbar: ${inline(placeToolbar)},
      toggleMark: ${inline(toggleMark)},
      clearMarks: ${inline(clearMarks)},
      hasMark: ${inline(hasMark)},
      marksToHtml: ${inline(marksToHtml)},
      validLink: ${inline(validLink)}
    };

    var selected = null;
    var selectedItems = [];
    var editing = null;
    var editState = null;
    var bar = null;
    var menu = null;
    var fmt = null;
    var hint = null;
    var press = null;
    var drag = null;
    var hovered = null;
    var suppressClick = false;
    var scale = 1;
    var clipboard = false;
    var lastPointer = { x: 0, y: 0 };
    var scrollTimer = null;
    var reposition = 0;

    function post(message) { window.parent.postMessage(message, origin); }
    function closest(node, selector) { return node && node.closest ? node.closest(selector) : null; }
    function icon(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + "</svg>"; }
    function viewport() {
      if (window.innerWidth < 500) return "mobile";
      if (window.innerWidth < 1100) return "tablet";
      return "desktop";
    }
    function topSections() {
      return Array.prototype.filter.call(document.querySelectorAll("[data-section-id]"), function (node) {
        return !node.parentElement || !node.parentElement.closest("[data-section-id], .eos-ui");
      });
    }
    function sectionOf(node) { return closest(node, "[data-section-id]"); }
    function itemOf(node) { return closest(node, "[data-item-id]"); }
    function zoneOf(node) { return closest(node, "[data-freeform]"); }
    function overlayOf(node) { var zone = zoneOf(node); return !!(zone && zone.getAttribute("data-overlay") === "true"); }
    function providerLock(node) { return closest(node, "[data-locked=provider]"); }
    function isLocked(node) { return !!(node && (providerLock(node) || node.getAttribute("data-item-locked") === "true")); }
    function isUi(node) { return !!closest(node, ".eos-ui, .eos-gap"); }
    function isFreeformItem(node) {
      if (!node || !node.getAttribute || !node.getAttribute("data-item-id")) return false;
      if (zoneOf(node)) return true;
      var flow = closest(node, '[data-section-type="flow"]');
      return !!(flow && flow.getAttribute("data-layout") === "fluid");
    }
    function isFlowBlock(node) {
      if (!node || !node.getAttribute || !node.getAttribute("data-item-id") || isFreeformItem(node)) return false;
      return !!closest(node, '[data-section-type="flow"]');
    }
    function isSection(node) { return !!(node && node.getAttribute && node.getAttribute("data-section-id") && topSections().indexOf(node) >= 0); }
    function chromeOf(node) { return closest(node, "[data-chrome]"); }

    function kindOf(node) {
      if (!node) return "";
      if (node.getAttribute("data-nav-route")) return "nav";
      if (node.getAttribute("data-chrome")) return node.getAttribute("data-chrome");
      if (node.getAttribute("data-item-id")) return node.getAttribute("data-kind") || (node.getAttribute("data-image") ? "image" : "text");
      if (node.getAttribute("data-freeform")) return "zone";
      if (node.getAttribute("data-section-id")) {
        var type = node.getAttribute("data-section-type") || "section";
        return type === "flow" || type === "preset" || type === "designed" ? "section" : type;
      }
      return "";
    }
    var LABELS = { section: "Section", header: "Header", footer: "Footer", nav: "Menu link", zone: "Freeform zone", eyebrow: "Small heading", heading: "Heading", paragraph: "Paragraph", button: "Button", link: "Link", image: "Image", graphic: "Graphic", card: "Card", person: "Person", quote: "Quote", list: "List", text: "Text", callout: "Callout", testimonial: "Testimonial", promo: "Promotion", insights: "Insights list", "brand-mark": "Logo mark", gallery: "Gallery", video: "Video", cta: "Call to action", features: "Features", faq: "FAQ", form: "Form", newsletter: "Newsletter", map: "Map", search: "Search", social: "Social links", divider: "Divider", spacer: "Spacer", line: "Line", audio: "Audio", embed: "Embed", "insights-summary": "Insights summary", freeform: "Freeform zone" };
    function labelOf(node) {
      var name = node && node.getAttribute ? node.getAttribute("data-editor-name") : "";
      return name || LABELS[kindOf(node)] || "Item";
    }

    function canEditText(field) {
      if (!field || field.nodeName === "IMG" || isLocked(field)) return false;
      var item = itemOf(field);
      if (item && item.getAttribute("data-item-locked") === "true") return false;
      if (field.hasAttribute("data-blog-field") || field.hasAttribute("data-blog-block")) return field.nodeName !== "IMG";
      if (chromeOf(field)) return field.hasAttribute("data-chrome-field") || field.hasAttribute("data-nav-route") || field.getAttribute("data-field") === "announcement";
      if (!field.hasAttribute("data-field")) return false;
      var section = sectionOf(field);
      return !!(section && section.getAttribute("data-section-type") !== "designed");
    }
    function textFieldIn(node) {
      if (!node) return null;
      if (node.matches && node.matches("[data-field], [data-blog-field]") && canEditText(node)) return node;
      var fields = node.querySelectorAll ? node.querySelectorAll("[data-field], [data-blog-field]") : [];
      for (var i = 0; i < fields.length; i++) if (canEditText(fields[i])) return fields[i];
      return null;
    }
    function multiline(field) {
      return !closest(field, "h1, h2, h3, h4, h5, a, button, label, li, dt, .eyebrow") && !field.hasAttribute("data-nav-route") && !field.hasAttribute("data-chrome-field");
    }

    function caps(node) {
      var c = { move: false, reorder: false, freeform: false, duplicate: false, hide: false, remove: false, template: false, copy: false, layer: false, image: false, edit: false, open: false };
      if (!node || isLocked(node)) return c;
      if (node.getAttribute("data-nav-route")) { c.edit = true; c.open = true; return c; }
      if (node.getAttribute("data-chrome")) return c;
      if (chromeOf(node)) { c.edit = canEditText(node); return c; }
      c.edit = !!textFieldIn(node);
      c.image = !!(node.getAttribute("data-image") || (node.querySelector && node.querySelector(":scope > img, :scope > figure img")));
      if (isSection(node)) {
        var type = node.getAttribute("data-section-type");
        c.move = true;
        c.hide = true;
        c.duplicate = type !== "designed";
        c.remove = type !== "designed";
        c.template = type !== "designed";
        c.copy = type !== "designed";
        return c;
      }
      if (isFreeformItem(node)) { c.freeform = true; c.move = true; c.duplicate = true; c.hide = true; c.remove = true; c.layer = !!zoneOf(node); return c; }
      if (isFlowBlock(node)) {
        var flow = closest(node, '[data-section-type="flow"]');
        c.reorder = flow.getAttribute("data-layout") !== "hero";
        c.move = c.reorder;
        c.duplicate = true; c.hide = true; c.remove = true;
        return c;
      }
      return c;
    }

    function payload(node) {
      var section = sectionOf(node);
      var item = itemOf(node);
      var chrome = chromeOf(node);
      return {
        type: "4eos-select",
        sectionId: section ? section.getAttribute("data-section-id") : "",
        itemId: item ? item.getAttribute("data-item-id") : "",
        itemIds: selectedItems.map(function (entry) { return entry.getAttribute("data-item-id"); }).filter(Boolean),
        overlay: overlayOf(node),
        locked: isLocked(node),
        chrome: chrome && !section ? chrome.getAttribute("data-chrome") : "",
        navRoute: node && node.getAttribute ? node.getAttribute("data-nav-route") || "" : "",
        kind: kindOf(node),
      };
    }

    function ensureChrome() {
      if (!document.getElementById("eos-style")) {
        var style = document.createElement("style");
        style.id = "eos-style";
        style.textContent = STYLE;
        document.head.appendChild(style);
      }
      document.querySelectorAll("[data-locked=provider]").forEach(function (node) {
        if (node.querySelector(":scope > .eos-lock")) return;
        if (window.getComputedStyle(node).position === "static") node.style.position = "relative";
        var badge = document.createElement("span");
        badge.className = "eos-lock eos-chrome";
        badge.innerHTML = icon("lock") + "<span>Managed for you</span>";
        badge.title = LOCK;
        node.appendChild(badge);
      });
      document.querySelectorAll("[data-hidden=true]").forEach(function (node) {
        if (window.getComputedStyle(node).position === "static") node.style.position = "relative";
      });
    }
    function gap(beforeId, index, empty) {
      var node = document.createElement("div");
      node.className = "eos-gap" + (empty ? " is-empty" : "");
      node.dataset.before = beforeId;
      node.dataset.index = String(index);
      node.innerHTML = '<div class="eos-gap-hit"><div class="eos-gap-line"></div><button class="eos-add" type="button">' + icon("plus") + "<span>" + (empty ? "Add your first section" : "Add section") + "</span></button></div>";
      node.querySelector(".eos-add").setAttribute("aria-label", empty ? "Add your first section" : "Add a section here");
      return node;
    }
    function paint() {
      ensureChrome();
      if (document.querySelector("[data-lock-copy]")) return;
      var sections = topSections();
      var gaps = document.querySelectorAll(".eos-gap");
      var expected = sections.length === 0 ? (document.querySelector("[data-empty-page]") ? 1 : 0) : sections.length + 1;
      var fresh = gaps.length === expected && Array.prototype.every.call(gaps, function (node, index) {
        return sections.length === 0 ? node.classList.contains("is-empty") : node.dataset.before === (sections[index] ? sections[index].getAttribute("data-section-id") : "");
      });
      if (fresh) return;
      gaps.forEach(function (node) { node.remove(); });
      if (sections.length === 0) {
        var empty = document.querySelector("[data-empty-page]");
        if (empty) empty.parentNode.insertBefore(gap("", 0, true), empty);
        return;
      }
      sections.forEach(function (section, index) {
        section.parentNode.insertBefore(gap(section.getAttribute("data-section-id"), index, false), section);
        if (index === sections.length - 1) section.parentNode.insertBefore(gap("", index + 1, false), section.nextSibling);
      });
      markNearGaps();
    }
    function markNearGaps() {
      document.querySelectorAll(".eos-gap.is-near").forEach(function (node) { node.classList.remove("is-near"); });
      if (!selected || !isSection(selected) || drag) return;
      var before = selected.previousElementSibling;
      var after = selected.nextElementSibling;
      if (before && before.classList.contains("eos-gap")) before.classList.add("is-near");
      if (after && after.classList.contains("eos-gap")) after.classList.add("is-near");
    }

    function removeUi(node) { if (node && node.parentNode) node.parentNode.removeChild(node); return null; }
    function clearHandles() { document.querySelectorAll(".eos-handle").forEach(function (node) { node.remove(); }); }
    function clearSelected(silent) {
      clearHandles();
      document.querySelectorAll(".eos-selected").forEach(function (node) { node.classList.remove("eos-selected"); });
      bar = removeUi(bar);
      closeMenu(false);
      selected = null;
      selectedItems = [];
      markNearGaps();
      if (!silent) post({ type: "4eos-select", sectionId: "", itemId: "", itemIds: [], overlay: false, locked: false, chrome: "", kind: "" });
    }

    function selectableFor(target) {
      if (!target || !target.closest) return null;
      var locked = providerLock(target);
      if (locked) return locked;
      var hit = closest(target, "[data-zone-hit]");
      if (hit) return zoneOf(hit);
      var nav = closest(target, "[data-nav-route]");
      if (nav) return nav;
      var chromeField = closest(target, "[data-chrome-field]");
      if (chromeField) return chromeField;
      var item = itemOf(target);
      if (item) return item;
      var chrome = chromeOf(target);
      if (chrome && !sectionOf(target)) return chrome;
      var blogField = closest(target, "[data-blog-field], [data-blog-block]");
      if (blogField) return blogField;
      return sectionOf(target);
    }

    function select(node, additive, silent) {
      if (!node) { clearSelected(silent); return; }
      if (additive && isFreeformItem(node) && selectedItems.length && zoneOf(selectedItems[0]) === zoneOf(node)) {
        var at = selectedItems.indexOf(node);
        if (at >= 0) selectedItems.splice(at, 1); else selectedItems.push(node);
        document.querySelectorAll(".eos-selected").forEach(function (marked) { marked.classList.remove("eos-selected"); });
        selectedItems.forEach(function (marked) { marked.classList.add("eos-selected"); });
        selected = selectedItems[selectedItems.length - 1] || null;
        if (!selected) { clearSelected(silent); return; }
      } else {
        clearHandles();
        document.querySelectorAll(".eos-selected").forEach(function (marked) { marked.classList.remove("eos-selected"); });
        closeMenu(false);
        selected = node;
        selectedItems = node.getAttribute("data-item-id") ? [node] : [];
        node.classList.add("eos-selected");
      }
      if (hovered) { hovered.classList.remove("eos-hover", "eos-locked-hover"); hovered = null; }
      if (isFreeformItem(selected) && !isLocked(selected)) {
        ["nw", "ne", "sw", "se"].forEach(function (corner) {
          var handle = document.createElement("button");
          handle.className = "eos-handle eos-" + corner;
          handle.type = "button";
          handle.tabIndex = -1;
          handle.dataset.corner = corner;
          handle.setAttribute("aria-label", "Resize");
          selected.appendChild(handle);
        });
      }
      showBar();
      markNearGaps();
      if (!silent) post(payload(selected));
    }

    function button(name, label, act, extra) {
      var node = document.createElement("button");
      node.type = "button";
      node.innerHTML = icon(name);
      node.setAttribute("aria-label", label);
      node.setAttribute("data-tip", label);
      node.dataset.act = act;
      if (extra) extra(node);
      return node;
    }
    function sep() { var node = document.createElement("span"); node.className = "eos-sep"; return node; }

    function showBar() {
      bar = removeUi(bar);
      if (!selected || editing || drag) return;
      bar = document.createElement("div");
      bar.className = "eos-ui eos-bar";
      bar.setAttribute("role", "toolbar");
      bar.setAttribute("aria-label", labelOf(selected) + " tools");
      var c = caps(selected);
      var chip = document.createElement("span");
      chip.className = "eos-chip";
      if (isLocked(selected)) {
        chip.innerHTML = icon("lock") + "<span>Managed for you</span>";
        chip.title = LOCK;
        bar.appendChild(chip);
      } else {
        chip.textContent = labelOf(selected);
        bar.appendChild(chip);
        var tools = [];
        if (c.move) tools.push(button("grip", c.freeform ? "Drag to move" : "Drag to reorder", "grip", function (node) { node.classList.add("eos-grip"); node.setAttribute("aria-label", (c.freeform ? "Move" : "Reorder") + ". Use Alt and the arrow keys to move with the keyboard"); }));
        if (c.edit) tools.push(button("edit", "Edit text", "edit"));
        if (c.image) tools.push(button("image", "Replace image", "replace"));
        if (c.open) tools.push(button("open", "Go to this page", "open"));
        if (c.duplicate) tools.push(button("duplicate", "Duplicate", "duplicate"));
        if (c.hide) {
          var hidden = selected.getAttribute("data-hidden") === "true";
          tools.push(button(hidden ? "eyeOff" : "eye", hidden ? "Show on the website" : "Hide from the website", hidden ? "show" : "hide"));
        }
        if (tools.length) bar.appendChild(sep());
        tools.forEach(function (node) { bar.appendChild(node); });
        if (menuItems(selected).length) {
          bar.appendChild(button("more", "More actions", "more", function (node) {
            node.setAttribute("aria-haspopup", "menu");
            node.setAttribute("aria-expanded", "false");
          }));
        }
      }
      document.body.appendChild(bar);
      placeBar();
    }
    function headerInset() {
      var header = document.querySelector("header.sticky, .site-header.sticky");
      if (!header || (selected && header.contains(selected))) return 0;
      var rect = header.getBoundingClientRect();
      return rect.bottom > 0 ? rect.bottom : 0;
    }
    function placeUi(node, target) {
      if (!node || !target) return;
      node.style.transform = "scale(" + 1 / scale + ")";
      var rect = target.getBoundingClientRect();
      var size = { width: node.offsetWidth / scale, height: node.offsetHeight / scale };
      var spot = H.placeToolbar({ top: rect.top, left: rect.left, width: rect.width, height: rect.height }, size, { width: window.innerWidth, height: window.innerHeight }, headerInset(), 8);
      node.style.top = spot.top + "px";
      node.style.left = spot.left + "px";
    }
    function placeBar() {
      placeUi(bar, selected);
      placeUi(fmt, editing);
      if (menu && menu.anchor) placeMenu();
    }

    function menuItems(node) {
      var c = caps(node);
      var items = [];
      if (!node || isLocked(node)) return items;
      if (c.image) {
        items.push(["replace", "Replace image", "image"]);
        items.push(["crop", "Crop image", "crop"]);
        items.push(["alt", "Edit alt text", "alt"]);
        items.push("-");
      }
      if (isSection(node)) {
        var sections = topSections();
        var at = sections.indexOf(node);
        items.push(["up", "Move up", "up", at <= 0, "Alt+Up"]);
        items.push(["down", "Move down", "down", at >= sections.length - 1, "Alt+Down"]);
        if (c.copy) items.push(["copy", "Copy section", "copy"]);
        if (clipboard) items.push(["paste", "Paste section below", "paste"]);
        if (c.template) items.push(["template", "Save as template", "template"]);
      } else if (c.reorder) {
        var siblings = Array.prototype.filter.call(node.parentElement.children, function (entry) { return entry.getAttribute && entry.getAttribute("data-item-id"); });
        var index = siblings.indexOf(node);
        items.push(["block-up", "Move up", "up", index <= 0, "Alt+Up"]);
        items.push(["block-down", "Move down", "down", index >= siblings.length - 1, "Alt+Down"]);
      } else if (c.layer) {
        items.push(["forward", "Bring forward", "forward"]);
        items.push(["back", "Send backward", "backward"]);
      }
      if (c.hide) items.push(node.getAttribute("data-hidden") === "true" ? ["show", "Show on the website", "eye"] : ["hide", "Hide from the website", "eyeOff"]);
      if (c.remove) { items.push("-"); items.push(["delete", "Delete", "trash", false, "Del", true]); }
      while (items.length && items[items.length - 1] === "-") items.pop();
      while (items.length && items[0] === "-") items.shift();
      return items;
    }
    function openMenu(anchor, point) {
      closeMenu(false);
      if (!selected) return;
      var items = menuItems(selected);
      if (!items.length) return;
      menu = document.createElement("div");
      menu.className = "eos-ui eos-menu";
      menu.setAttribute("role", "menu");
      menu.setAttribute("aria-label", labelOf(selected) + " actions");
      menu.anchor = anchor || null;
      menu.point = point || null;
      items.forEach(function (entry) {
        if (entry === "-") { var line = document.createElement("div"); line.setAttribute("role", "separator"); menu.appendChild(line); return; }
        var node = document.createElement("button");
        node.type = "button";
        node.setAttribute("role", "menuitem");
        node.tabIndex = -1;
        node.dataset.act = entry[0];
        node.innerHTML = icon(entry[2]) + "<span>" + entry[1] + "</span>" + (entry[4] ? "<kbd>" + entry[4] + "</kbd>" : "");
        if (entry[3]) { node.disabled = true; node.setAttribute("aria-disabled", "true"); }
        if (entry[5]) node.classList.add("eos-danger");
        menu.appendChild(node);
      });
      document.body.appendChild(menu);
      if (anchor) anchor.setAttribute("aria-expanded", "true");
      placeMenu();
      var first = menu.querySelector("[role=menuitem]:not([disabled])");
      if (first) first.focus();
    }
    function placeMenu() {
      if (!menu) return;
      menu.style.transform = "scale(" + 1 / scale + ")";
      var width = menu.offsetWidth / scale;
      var height = menu.offsetHeight / scale;
      var x, y;
      if (menu.anchor && menu.anchor.isConnected) {
        var rect = menu.anchor.getBoundingClientRect();
        x = rect.right - width;
        y = rect.bottom + 6;
        if (y + height > window.innerHeight - 8) y = rect.top - height - 6;
      } else if (menu.point) {
        x = menu.point.x;
        y = menu.point.y;
        if (y + height > window.innerHeight - 8) y = menu.point.y - height;
      } else return;
      menu.style.left = Math.max(8, Math.min(x, window.innerWidth - width - 8)) + "px";
      menu.style.top = Math.max(8, Math.min(y, window.innerHeight - height - 8)) + "px";
    }
    function closeMenu(focusAnchor) {
      if (!menu) return;
      var anchor = menu.anchor;
      menu = removeUi(menu);
      if (anchor) {
        anchor.setAttribute("aria-expanded", "false");
        if (focusAnchor && anchor.isConnected) anchor.focus();
      }
    }

    function flash(text) {
      hint = removeUi(hint);
      hint = document.createElement("div");
      hint.className = "eos-ui eos-hint";
      hint.setAttribute("role", "status");
      hint.textContent = text;
      document.body.appendChild(hint);
      var target = editing || selected;
      if (target) placeUi(hint, target);
      else { hint.style.top = "12px"; hint.style.left = "12px"; }
      var shown = hint;
      setTimeout(function () { if (hint === shown) hint = removeUi(hint); }, 1800);
    }

    function runAct(act, anchor) {
      if (!selected) return;
      var section = sectionOf(selected);
      var item = itemOf(selected);
      var base = { sectionId: section ? section.getAttribute("data-section-id") : "", itemId: item ? item.getAttribute("data-item-id") : "", itemIds: selectedItems.map(function (entry) { return entry.getAttribute("data-item-id"); }).filter(Boolean), overlay: overlayOf(selected) };
      if (act === "more") { if (menu) closeMenu(true); else openMenu(anchor, null); return; }
      if (act === "edit") { var field = textFieldIn(selected); if (field) beginEdit(field); return; }
      if (act === "open") { post({ type: "4eos-navigate", path: selected.getAttribute("data-nav-route") }); return; }
      closeMenu(false);
      if (act === "replace" || act === "crop" || act === "alt") { post(Object.assign({ type: "4eos-menu", action: act }, base)); return; }
      if (act === "block-up" || act === "block-down") { moveBlockBy(act === "block-up" ? -1 : 1); return; }
      if (act === "up" || act === "down") { moveSectionBy(act === "up" ? -1 : 1); return; }
      if (act === "copy") { clipboard = true; post(Object.assign({ type: "4eos-action", action: "copy" }, base)); flash("Section copied"); return; }
      post(Object.assign({ type: "4eos-action", action: act }, base));
    }

    function moveSectionBy(step) {
      if (!selected || !isSection(selected)) return;
      var sections = topSections();
      var at = sections.indexOf(selected);
      var target = step < 0 ? at - 1 : at + 2;
      if (at < 0 || target < 0 || target > sections.length) return;
      var before = sections[target];
      post({ type: "4eos-move", sectionId: selected.getAttribute("data-section-id"), beforeId: before ? before.getAttribute("data-section-id") : "" });
    }
    function moveBlockBy(step) {
      if (!selected || !isFlowBlock(selected) || !caps(selected).reorder) return;
      var siblings = Array.prototype.filter.call(selected.parentElement.children, function (entry) { return entry.getAttribute && entry.getAttribute("data-item-id"); });
      var at = siblings.indexOf(selected);
      var other = siblings[at + step];
      if (!other) return;
      post({ type: "4eos-reorder-block", sectionId: sectionOf(selected).getAttribute("data-section-id"), itemId: selected.getAttribute("data-item-id"), targetId: other.getAttribute("data-item-id"), after: step > 0 });
    }

    function readBox(item) {
      var rect = item.getBoundingClientRect();
      var zone = zoneOf(item) || item.offsetParent || item.parentElement;
      var zoneRect = zone.getBoundingClientRect();
      return { x: (rect.left - zoneRect.left) / (zoneRect.width || 1), y: (rect.top - zoneRect.top) / (zoneRect.height || 1), w: rect.width / (zoneRect.width || 1), h: rect.height / (zoneRect.height || 1) };
    }
    function applyBox(item, box) {
      var key = viewport() === "mobile" ? "m" : viewport() === "tablet" ? "t" : "d";
      if (zoneOf(item)) {
        item.style.setProperty("--" + key + "x", box.x);
        item.style.setProperty("--" + key + "y", box.y);
        item.style.setProperty("--" + key + "w", box.w);
        item.style.setProperty("--" + key + "h", box.h);
        if (key === "t") item.classList.add("has-tablet");
        if (key === "m") item.classList.add("has-mobile");
      } else {
        item.style.left = box.x * 100 + "%";
        item.style.top = box.y * 100 + "%";
        item.style.width = box.w * 100 + "%";
      }
    }
    function placeMessage(item, fellows) {
      var zone = zoneOf(item);
      var items = [{ id: item.getAttribute("data-item-id"), placement: readBox(item) }];
      (fellows || []).forEach(function (fellow) { items.push({ id: fellow.node.getAttribute("data-item-id"), placement: readBox(fellow.node) }); });
      return { type: "4eos-place", sectionId: zone ? zone.getAttribute("data-freeform") : sectionOf(item).getAttribute("data-section-id"), overlay: overlayOf(item), viewport: viewport(), items: items };
    }

    function ghostFor(node) {
      var ghost = document.createElement("div");
      ghost.className = "eos-ui eos-ghost";
      var label = document.createElement("div");
      label.className = "eos-ghost-label";
      label.textContent = "Moving " + labelOf(node).toLowerCase();
      ghost.appendChild(label);
      var rect = node.getBoundingClientRect();
      var body = document.createElement("div");
      body.className = "eos-ghost-body";
      var copy = node.cloneNode(true);
      copy.querySelectorAll(".eos-ui, .eos-handle, .eos-gap, iframe, video, audio, script").forEach(function (entry) { entry.remove(); });
      copy.classList.remove("eos-selected", "eos-hover");
      [copy].concat(Array.prototype.slice.call(copy.querySelectorAll("[data-section-id], [data-item-id], [data-field], [id]"))).forEach(function (entry) {
        ["data-section-id", "data-item-id", "data-block-id", "data-field", "data-freeform", "id"].forEach(function (name) { entry.removeAttribute(name); });
      });
      copy.style.width = rect.width + "px";
      copy.style.position = "static";
      copy.style.margin = "0";
      body.style.transform = "scale(" + Math.min(1, 240 / Math.max(1, rect.width)) + ")";
      body.appendChild(copy);
      ghost.appendChild(body);
      document.body.appendChild(ghost);
      return ghost;
    }
    function siblingBlocks(node) {
      return Array.prototype.filter.call(node.parentElement.children, function (entry) { return entry !== node && entry.getAttribute && entry.getAttribute("data-item-id"); });
    }

    function startDrag(p, event) {
      var node = p.node;
      window.getSelection().removeAllRanges();
      closeMenu(false);
      bar = removeUi(bar);
      document.body.classList.add("eos-dragging");
      drag = { kind: p.kind, node: node, x: p.x, y: p.y, target: null };
      if (p.kind === "section") {
        drag.from = topSections().indexOf(node);
        node.classList.add("eos-drag-source");
        drag.ghost = ghostFor(node);
      } else if (p.kind === "block") {
        node.classList.add("eos-drag-source");
        drag.ghost = ghostFor(node);
        drag.line = document.createElement("div");
        drag.line.className = "eos-insert-line eos-ui";
        drag.line.style.display = "none";
        document.body.appendChild(drag.line);
      } else {
        var zone = zoneOf(node) || node.offsetParent || node.parentElement;
        drag.zone = zone;
        drag.box = readBox(node);
        drag.corner = p.corner || "";
        drag.fellows = [];
        var group = node.getAttribute("data-group");
        var moving = selectedItems.indexOf(node) >= 0 ? selectedItems.filter(function (entry) { return entry !== node; }) : [];
        if (group) zone.querySelectorAll('[data-group="' + group + '"]').forEach(function (entry) { if (entry !== node && moving.indexOf(entry) < 0) moving.push(entry); });
        moving.forEach(function (entry) { drag.fellows.push({ node: entry, box: readBox(entry) }); });
        drag.others = Array.prototype.filter.call(zone.querySelectorAll("[data-item-id]"), function (entry) { return entry !== node && moving.indexOf(entry) < 0; }).map(readBox);
      }
      scrollTimer = setInterval(function () {
        if (!drag) return;
        var step = H.autoScrollStep(lastPointer.y, window.innerHeight, 56, 18);
        if (step) { window.scrollBy(0, step); updateDrag(lastPointer.x, lastPointer.y); }
      }, 16);
      updateDrag(event.clientX, event.clientY);
    }
    function clearGuides() { document.querySelectorAll(".eos-guide").forEach(function (node) { node.remove(); }); }
    function updateDrag(x, y) {
      if (!drag) return;
      if (drag.ghost) { drag.ghost.style.left = x + 14 + "px"; drag.ghost.style.top = y + 14 + "px"; }
      if (drag.kind === "section") {
        var nodes = Array.prototype.slice.call(document.querySelectorAll(".eos-gap"));
        var gaps = nodes.map(function (node, index) { var rect = node.getBoundingClientRect(); return { index: index, center: rect.top }; });
        var index = H.sectionDropIndex(y, gaps, drag.from);
        nodes.forEach(function (node, at) { node.classList.toggle("is-hot", at === index); });
        drag.target = index === null ? null : nodes[index];
        return;
      }
      if (drag.kind === "block") {
        var siblings = siblingBlocks(drag.node);
        var rects = siblings.map(function (node) { var rect = node.getBoundingClientRect(); return { top: rect.top, left: rect.left, width: rect.width, height: rect.height }; });
        var spot = H.insertionIndex(x, y, rects);
        var all = Array.prototype.filter.call(drag.node.parentElement.children, function (entry) { return entry.getAttribute && entry.getAttribute("data-item-id"); });
        var current = all.indexOf(drag.node);
        if (rects.length === 0 || spot.index === current) { drag.target = null; drag.line.style.display = "none"; return; }
        var anchor = spot.index < siblings.length ? siblings[spot.index] : siblings[siblings.length - 1];
        var after = spot.index >= siblings.length;
        var box = anchor.getBoundingClientRect();
        drag.target = { id: anchor.getAttribute("data-item-id"), after: after };
        drag.line.style.display = "block";
        if (spot.horizontal) {
          drag.line.style.left = (after ? box.right + 4 : box.left - 5) + "px";
          drag.line.style.top = box.top + "px";
          drag.line.style.width = "3px";
          drag.line.style.height = box.height + "px";
        } else {
          drag.line.style.left = box.left + "px";
          drag.line.style.top = (after ? box.bottom + 4 : box.top - 5) + "px";
          drag.line.style.width = box.width + "px";
          drag.line.style.height = "3px";
        }
        return;
      }
      var zoneRect = drag.zone.getBoundingClientRect();
      var dx = (x - drag.x) / (zoneRect.width || 1);
      var dy = (y - drag.y) / (zoneRect.height || 1);
      var next = { x: drag.box.x, y: drag.box.y, w: drag.box.w, h: drag.box.h };
      clearGuides();
      if (drag.kind === "resize") {
        var left = drag.corner.indexOf("w") >= 0;
        var top = drag.corner.indexOf("n") >= 0;
        next.w = Math.max(0.06, Math.min(1, drag.box.w + (left ? -dx : dx)));
        next.h = Math.max(0.04, Math.min(1, drag.box.h + (top ? -dy : dy)));
        if (left) next.x = Math.max(0, drag.box.x + drag.box.w - next.w);
        if (top) next.y = Math.max(0, drag.box.y + drag.box.h - next.h);
      } else {
        next.x = drag.box.x + dx;
        next.y = drag.box.y + dy;
        var snapped = H.snapBox(next, drag.others, zoneRect.width, zoneRect.height, 6);
        next = snapped.box;
        if (window.getComputedStyle(drag.zone).position === "static") drag.zone.style.position = "relative";
        snapped.guidesX.forEach(function (share) { var line = document.createElement("div"); line.className = "eos-guide"; line.style.left = share * 100 + "%"; line.style.top = "0"; line.style.bottom = "0"; line.style.width = "1px"; drag.zone.appendChild(line); });
        snapped.guidesY.forEach(function (share) { var line = document.createElement("div"); line.className = "eos-guide"; line.style.top = share * 100 + "%"; line.style.left = "0"; line.style.right = "0"; line.style.height = "1px"; drag.zone.appendChild(line); });
      }
      applyBox(drag.node, next);
      var mx = next.x - drag.box.x;
      var my = next.y - drag.box.y;
      drag.fellows.forEach(function (fellow) {
        if (drag.kind === "resize") return;
        applyBox(fellow.node, H.nudgeBox(fellow.box, mx, my));
      });
      drag.moved = true;
    }
    function endDrag(cancel) {
      if (!drag) return;
      var d = drag;
      drag = null;
      clearInterval(scrollTimer);
      document.body.classList.remove("eos-dragging");
      if (d.ghost) removeUi(d.ghost);
      if (d.line) removeUi(d.line);
      clearGuides();
      if (d.node) d.node.classList.remove("eos-drag-source");
      document.querySelectorAll(".eos-gap.is-hot").forEach(function (node) { node.classList.remove("is-hot"); });
      if (d.kind === "section") {
        if (!cancel && d.target) post({ type: "4eos-move", sectionId: d.node.getAttribute("data-section-id"), beforeId: d.target.dataset.before || "" });
      } else if (d.kind === "block") {
        if (!cancel && d.target) post({ type: "4eos-reorder-block", sectionId: sectionOf(d.node).getAttribute("data-section-id"), itemId: d.node.getAttribute("data-item-id"), targetId: d.target.id, after: d.target.after });
      } else if (cancel || !d.moved) {
        applyBox(d.node, d.box);
        d.fellows.forEach(function (fellow) { applyBox(fellow.node, fellow.box); });
      } else {
        post(placeMessage(d.node, d.fellows));
      }
      if (cancel) flash("Move canceled");
      showBar();
      markNearGaps();
    }

    function readText(field) {
      var out = "";
      (function walk(node) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var child = node.childNodes[i];
          if (child.nodeType === 3) out += child.data;
          else if (child.nodeName === "BR") { if (!child.hasAttribute("data-eos-end")) out += String.fromCharCode(10); }
          else if (child.nodeType === 1 && !child.classList.contains("eos-ui") && !child.classList.contains("eos-handle")) walk(child);
        }
      })(field);
      return out;
    }
    function toHex(value) {
      if (!value) return "";
      if (value.charAt(0) === "#") return value.toLowerCase();
      var parts = value.match(/[0-9.]+/g);
      if (!parts || parts.length < 3) return "";
      return "#" + parts.slice(0, 3).map(function (part) { var hex = Math.round(Number(part)).toString(16); return hex.length === 1 ? "0" + hex : hex; }).join("");
    }
    function readMarks(field) {
      var marks = [];
      var count = 0;
      (function walk(node) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var child = node.childNodes[i];
          if (child.nodeType === 3) { count += child.data.length; continue; }
          if (child.nodeName === "BR") { if (!child.hasAttribute("data-eos-end")) count += 1; continue; }
          if (child.nodeType !== 1 || child.classList.contains("eos-ui") || child.classList.contains("eos-handle")) continue;
          var start = count;
          walk(child);
          var name = child.nodeName;
          if (count <= start) continue;
          if (name === "STRONG" || name === "B") marks.push({ start: start, end: count, kind: "bold" });
          if (name === "EM" || name === "I") marks.push({ start: start, end: count, kind: "italic" });
          if (name === "U") marks.push({ start: start, end: count, kind: "underline" });
          if (name === "A" && child.getAttribute("href")) marks.push({ start: start, end: count, kind: "link", href: child.getAttribute("href") });
          if (name === "SPAN" && (child.getAttribute("data-color") || child.style.color)) {
            var color = toHex(child.getAttribute("data-color") || child.style.color);
            if (color) marks.push({ start: start, end: count, kind: "color", color: color });
          }
        }
      })(field);
      var merged = [];
      marks.forEach(function (mark) {
        var last = merged.filter(function (entry) { return entry.kind === mark.kind && entry.end === mark.start && entry.href === mark.href && entry.color === mark.color; })[0];
        if (last) last.end = mark.end; else merged.push(mark);
      });
      return merged;
    }
    function offsetAt(field, container, offset) {
      var count = 0;
      var found = -1;
      (function walk(node) {
        if (found >= 0) return;
        if (node === container && node.nodeType === 3) { found = count + offset; return; }
        if (node.nodeType === 3) { count += node.data.length; return; }
        if (node.nodeName === "BR") { if (!node.hasAttribute("data-eos-end")) count += 1; return; }
        for (var i = 0; i < node.childNodes.length; i++) {
          if (node === container && i === offset) { found = count; return; }
          walk(node.childNodes[i]);
          if (found >= 0) return;
        }
        if (node === container) found = count;
      })(field);
      return found < 0 ? count : found;
    }
    function pointAt(field, target) {
      var count = 0;
      var result = null;
      (function walk(node) {
        for (var i = 0; i < node.childNodes.length && !result; i++) {
          var child = node.childNodes[i];
          if (child.nodeType === 3) {
            if (target <= count + child.data.length) { result = { node: child, offset: target - count }; return; }
            count += child.data.length;
          } else if (child.nodeName === "BR") {
            if (target <= count) { result = { node: node, offset: i }; return; }
            if (!child.hasAttribute("data-eos-end")) count += 1;
          } else if (child.nodeType === 1) walk(child);
        }
      })(field);
      return result || { node: field, offset: field.childNodes.length };
    }
    function getOffsets() {
      var sel = window.getSelection();
      if (!editing || !sel.rangeCount) return { start: 0, end: 0 };
      var range = sel.getRangeAt(0);
      if (!editing.contains(range.startContainer)) return editState && editState.saved ? editState.saved : { start: 0, end: 0 };
      var a = offsetAt(editing, range.startContainer, range.startOffset);
      var b = offsetAt(editing, range.endContainer, range.endOffset);
      return { start: Math.min(a, b), end: Math.max(a, b) };
    }
    function setOffsets(start, end) {
      if (!editing) return;
      var a = pointAt(editing, start);
      var b = pointAt(editing, end);
      var range = document.createRange();
      range.setStart(a.node, a.offset);
      range.setEnd(b.node, b.offset);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    function ensureEnd(field) {
      if (!multiline(field)) return;
      var last = field.lastChild;
      if (!last || last.nodeName !== "BR" || !last.hasAttribute("data-eos-end")) {
        var end = document.createElement("br");
        end.setAttribute("data-eos-end", "");
        field.appendChild(end);
      }
    }
    function render(field, text, marks) {
      field.innerHTML = H.marksToHtml(text, marks);
      ensureEnd(field);
    }
    function snapshot() {
      var offsets = getOffsets();
      return { text: readText(editing), marks: readMarks(editing), start: offsets.start, end: offsets.end };
    }
    function remember(force) {
      if (!editState) return;
      var now = Date.now();
      if (!force && now - editState.at < 600) return;
      editState.at = now;
      editState.undo.push(snapshot());
      if (editState.undo.length > 100) editState.undo.shift();
      editState.redo = [];
    }
    function restore(state) {
      render(editing, state.text, state.marks);
      setOffsets(state.start, state.end);
      updateFmt();
    }
    function editUndo(redo) {
      if (!editState) return;
      var from = redo ? editState.redo : editState.undo;
      var to = redo ? editState.undo : editState.redo;
      var state = from.pop();
      if (!state) return;
      to.push(snapshot());
      restore(state);
    }

    function beginEdit(field, x, y) {
      if (!canEditText(field)) return;
      if (editing === field) return;
      if (editing) finishEdit();
      var owner = selectableFor(field);
      if (owner && owner !== selected) select(owner, false, false);
      editing = field;
      editState = { undo: [], redo: [], at: 0, rich: field.getAttribute("data-rich") === "true", before: readText(field), saved: null };
      bar = removeUi(bar);
      closeMenu(false);
      field.setAttribute("contenteditable", "true");
      field.setAttribute("spellcheck", "true");
      field.classList.add("eos-editing");
      ensureEnd(field);
      field.focus({ preventScroll: true });
      var range = null;
      if (typeof x === "number" && document.caretRangeFromPoint) range = document.caretRangeFromPoint(x, y);
      else if (typeof x === "number" && document.caretPositionFromPoint) {
        var position = document.caretPositionFromPoint(x, y);
        if (position) { range = document.createRange(); range.setStart(position.offsetNode, position.offset); range.collapse(true); }
      }
      if (!range || !field.contains(range.startContainer)) {
        range = document.createRange();
        var end = pointAt(field, readText(field).length);
        range.setStart(end.node, end.offset);
        range.collapse(true);
      }
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      showFmt();
      post({ type: "4eos-editing", active: true, rich: editState.rich });
    }
    function finishEdit() {
      if (!editing) return;
      var field = editing;
      var state = editState;
      editing = null;
      editState = null;
      fmt = removeUi(fmt);
      field.querySelectorAll("br[data-eos-end]").forEach(function (node) { node.remove(); });
      var text = readText(field);
      var marks = state && state.rich ? readMarks(field) : undefined;
      field.removeAttribute("contenteditable");
      field.removeAttribute("spellcheck");
      field.classList.remove("eos-editing");
      window.getSelection().removeAllRanges();
      post({ type: "4eos-editing", active: false });
      showBar();
      if (state && text === state.before && !state.rich) return;
      if (field.getAttribute("data-blog-field") || field.getAttribute("data-blog-block")) {
        post({ type: "4eos-blog", field: field.getAttribute("data-blog-field") || "text", index: field.getAttribute("data-blog-block"), value: text });
        return;
      }
      if (field.hasAttribute("data-nav-route")) { post({ type: "4eos-nav", route: field.getAttribute("data-nav-route"), value: text }); return; }
      if (field.hasAttribute("data-chrome-field") || (chromeOf(field) && field.getAttribute("data-field") === "announcement")) {
        post({ type: "4eos-chrome", field: field.getAttribute("data-chrome-field") || field.getAttribute("data-field"), value: text });
        return;
      }
      var section = sectionOf(field);
      var item = itemOf(field);
      post({ type: "4eos-text", sectionId: section ? section.getAttribute("data-section-id") : "", itemId: item ? item.getAttribute("data-item-id") : "", field: field.getAttribute("data-field") || "text", value: text, marks: marks, overlay: overlayOf(field) });
    }

    function fmtButton(name, label, act, shortcut) {
      var node = button(name, label + (shortcut ? " (" + shortcut + ")" : ""), act);
      node.setAttribute("aria-label", label);
      return node;
    }
    function showFmt() {
      fmt = removeUi(fmt);
      if (!editing) return;
      fmt = document.createElement("div");
      fmt.className = "eos-ui eos-fmt";
      fmt.setAttribute("role", "toolbar");
      fmt.setAttribute("aria-label", "Text formatting");
      if (editState.rich) {
        var mod = /Mac|iPhone|iPad/.test(navigator.platform) ? "Cmd" : "Ctrl";
        fmt.appendChild(fmtButton("bold", "Bold", "fmt-bold", mod + "+B"));
        fmt.appendChild(fmtButton("italic", "Italic", "fmt-italic", mod + "+I"));
        fmt.appendChild(fmtButton("underline", "Underline", "fmt-underline", mod + "+U"));
        fmt.appendChild(sep());
        fmt.appendChild(fmtButton("link", "Add link", "fmt-link", mod + "+K"));
        fmt.appendChild(fmtButton("unlink", "Remove link", "fmt-unlink"));
        fmt.appendChild(fmtButton("color", "Text color", "fmt-color"));
        fmt.appendChild(fmtButton("clear", "Clear formatting", "fmt-clear"));
        fmt.appendChild(sep());
      }
      var done = fmtButton("check", "Done editing", "fmt-done", "Esc");
      fmt.appendChild(done);
      document.body.appendChild(fmt);
      placeUi(fmt, editing);
      updateFmt();
    }
    function updateFmt() {
      if (!fmt || !editing || !editState || !editState.rich) return;
      var offsets = getOffsets();
      var marks = readMarks(editing);
      [["fmt-bold", "bold"], ["fmt-italic", "italic"], ["fmt-underline", "underline"], ["fmt-link", "link"]].forEach(function (pair) {
        var node = fmt.querySelector('[data-act="' + pair[0] + '"]');
        if (node) node.setAttribute("aria-pressed", H.hasMark(marks, offsets.start, offsets.end, pair[1]) ? "true" : "false");
      });
      var unlink = fmt.querySelector('[data-act="fmt-unlink"]');
      if (unlink) unlink.disabled = !marks.some(function (mark) { return mark.kind === "link" && mark.start < Math.max(offsets.end, offsets.start + 1) && mark.end > offsets.start - (offsets.end > offsets.start ? 0 : 1); });
    }
    function applyFormat(kind, value, force) {
      if (!editing || !editState || !editState.rich) return;
      var offsets = editState.saved || getOffsets();
      editState.saved = null;
      var text = readText(editing);
      var marks = readMarks(editing);
      if (kind !== "clear" && kind !== "unlink" && offsets.end <= offsets.start) { editing.focus({ preventScroll: true }); setOffsets(offsets.start, offsets.end); flash("Select some words first"); return; }
      remember(true);
      if (kind === "clear") marks = H.clearMarks(marks, text.length, offsets.start, offsets.end);
      else if (kind === "unlink") {
        var start = offsets.start;
        var end = offsets.end;
        marks.forEach(function (mark) { if (mark.kind === "link" && mark.start <= Math.max(start, end - 1) && mark.end >= start) { start = Math.min(start, mark.start); end = Math.max(end, mark.end); } });
        marks = H.toggleMark(marks, text.length, start, end, "link", "", false);
      } else marks = H.toggleMark(marks, text.length, offsets.start, offsets.end, kind, value || "", force);
      render(editing, text, marks);
      editing.focus({ preventScroll: true });
      setOffsets(offsets.start, offsets.end);
      showFmt();
    }
    function openLinkInput() {
      if (!editing || !fmt) return;
      var offsets = getOffsets();
      if (offsets.end <= offsets.start) { flash("Select some words first"); return; }
      editState.saved = offsets;
      var existing = readMarks(editing).filter(function (mark) { return mark.kind === "link" && mark.start <= offsets.start && mark.end >= offsets.end; })[0];
      fmt.innerHTML = "";
      var input = document.createElement("input");
      input.type = "text";
      input.placeholder = "/contact or https://example.com";
      input.setAttribute("aria-label", "Link address");
      input.value = existing ? existing.href : "";
      var note = document.createElement("span");
      note.className = "eos-note";
      note.setAttribute("role", "alert");
      var apply = button("check", "Apply link", "link-apply");
      var cancel = button("unlink", "Cancel", "link-cancel");
      cancel.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
      fmt.appendChild(input);
      fmt.appendChild(apply);
      fmt.appendChild(cancel);
      fmt.appendChild(note);
      placeUi(fmt, editing);
      input.focus();
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); submitLink(input, note); }
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancelLink(); }
      });
    }
    function submitLink(input, note) {
      var href = input.value.trim();
      if (!H.validLink(href)) { note.textContent = "Use a page path like /contact, or a full https://, mailto:, or tel: address"; input.focus(); return; }
      applyFormat("link", href, true);
    }
    function cancelLink() {
      var saved = editState && editState.saved;
      if (editState) editState.saved = null;
      if (!editing) return;
      editing.focus({ preventScroll: true });
      if (saved) setOffsets(saved.start, saved.end);
      showFmt();
    }
    function openColors() {
      if (!editing || !fmt) return;
      var offsets = getOffsets();
      if (offsets.end <= offsets.start) { flash("Select some words first"); return; }
      editState.saved = offsets;
      fmt.innerHTML = "";
      COLORS.forEach(function (color) {
        var node = button("check", color.name, "color-pick");
        node.innerHTML = "";
        node.className = "eos-swatch";
        node.style.background = color.value;
        node.dataset.color = color.value;
        fmt.appendChild(node);
      });
      var reset = button("clear", "Default color", "color-reset");
      fmt.appendChild(reset);
      var cancel = button("unlink", "Cancel", "link-cancel");
      cancel.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
      fmt.appendChild(cancel);
      placeUi(fmt, editing);
      var first = fmt.querySelector("button");
      if (first) first.focus();
    }
    function insertPlain(text) {
      var sel = window.getSelection();
      if (!sel.rangeCount) return;
      remember(true);
      var range = sel.getRangeAt(0);
      range.deleteContents();
      var node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      editing.normalize();
    }

    function onUiAction(target, event) {
      var act = target.dataset.act;
      if (!act || target.disabled) return;
      if (act.indexOf("fmt-") === 0) {
        if (act === "fmt-done") { finishEdit(); return; }
        if (act === "fmt-link") { openLinkInput(); return; }
        if (act === "fmt-color") { openColors(); return; }
        applyFormat(act.slice(4));
        return;
      }
      if (act === "link-apply") { var input = fmt && fmt.querySelector("input"); if (input) submitLink(input, fmt.querySelector(".eos-note")); return; }
      if (act === "link-cancel") { cancelLink(); return; }
      if (act === "color-pick") { applyFormat("color", target.dataset.color, true); return; }
      if (act === "color-reset") {
        var saved = editState && editState.saved;
        if (saved && editing) {
          editState.saved = null;
          var text = readText(editing);
          remember(true);
          var marks = H.toggleMark(readMarks(editing), text.length, saved.start, saved.end, "color", "", false);
          render(editing, text, marks);
          editing.focus({ preventScroll: true });
          setOffsets(saved.start, saved.end);
          showFmt();
        }
        return;
      }
      runAct(act, target);
      void event;
    }

    document.addEventListener("pointerdown", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      if (event.button !== 0) return;
      if (menu && !menu.contains(target)) closeMenu(false);
      var ui = closest(target, ".eos-ui");
      if (ui) {
        if (ui === fmt || closest(target, ".eos-fmt")) { if (target.nodeName !== "INPUT") event.preventDefault(); return; }
        var grip = closest(target, '[data-act="grip"]');
        if (grip && selected) {
          var kind = isSection(selected) ? "section" : isFreeformItem(selected) ? "item" : "block";
          press = { kind: kind, node: selected, x: event.clientX, y: event.clientY, threshold: 4 };
          event.preventDefault();
        }
        return;
      }
      if (closest(target, ".eos-gap")) return;
      var handle = closest(target, ".eos-handle");
      var item = itemOf(target);
      var intent = H.pressIntent({
        editing: !!editing,
        insideEditingField: !!(editing && editing.contains(target)),
        onControl: false,
        onGrip: false,
        onResizeHandle: !!handle,
        onFreeformItem: isFreeformItem(item),
        locked: isLocked(item || target),
      });
      if (intent === "resize") { press = { kind: "resize", node: item, corner: handle.dataset.corner, x: event.clientX, y: event.clientY, threshold: 2 }; event.preventDefault(); return; }
      if (intent === "freeform") { press = { kind: "item", node: item, x: event.clientX, y: event.clientY, threshold: 6 }; return; }
      press = null;
    }, true);

    document.addEventListener("pointermove", function (event) {
      lastPointer = { x: event.clientX, y: event.clientY };
      if (press && !drag && (event.buttons & 1)) {
        if (H.passedThreshold(press.x, press.y, event.clientX, event.clientY, press.threshold)) {
          if (press.kind === "item" && selected !== press.node && selectedItems.indexOf(press.node) < 0) select(press.node, false, false);
          var started = press;
          press = null;
          startDrag(started, event);
        }
        return;
      }
      if (drag) { updateDrag(event.clientX, event.clientY); return; }
      if (event.buttons) return;
      var next = isUi(event.target) ? null : selectableFor(event.target);
      if (next === selected || (next && next === editing)) next = null;
      if (next !== hovered) {
        if (hovered) hovered.classList.remove("eos-hover", "eos-locked-hover");
        hovered = next;
        if (hovered) hovered.classList.add(isLocked(hovered) ? "eos-locked-hover" : "eos-hover");
      }
    });
    document.addEventListener("pointerup", function () {
      press = null;
      if (drag) { suppressClick = true; endDrag(false); setTimeout(function () { suppressClick = false; }, 0); }
    }, true);
    document.addEventListener("pointercancel", function () { press = null; if (drag) endDrag(true); });
    document.addEventListener("dragstart", function (event) {
      if (closest(event.target, "[data-item-id], [data-section-id], .eos-ui") && !(editing && editing.contains(event.target))) event.preventDefault();
    });

    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); return; }
      var ui = closest(target, ".eos-ui button");
      if (ui) { event.preventDefault(); event.stopPropagation(); onUiAction(ui, event); return; }
      if (closest(target, ".eos-ui")) return;
      var add = closest(target, ".eos-add");
      if (add) {
        event.preventDefault();
        var holder = closest(add, ".eos-gap");
        post({ type: "4eos-insert", index: Number(holder.dataset.index), beforeId: holder.dataset.before || "" });
        return;
      }
      if (editing && editing.contains(target)) { event.preventDefault(); return; }
      if (editing) finishEdit();
      var link = closest(target, "a[href]");
      var node = selectableFor(target);
      if (node) {
        if (link || closest(target, "button, input, textarea, select, form")) { event.preventDefault(); event.stopPropagation(); }
        select(node, event.shiftKey);
        return;
      }
      if (link) {
        event.preventDefault();
        event.stopPropagation();
        var url;
        try { url = new URL(link.href, window.location.href); } catch (error) { return; }
        if (url.origin === window.location.origin) post({ type: "4eos-navigate", path: url.pathname + url.search + url.hash });
        return;
      }
      clearSelected(false);
    }, true);

    document.addEventListener("dblclick", function (event) {
      var target = event.target;
      if (!target || !target.closest || isUi(target)) return;
      if (editing && editing.contains(target)) return;
      var image = closest(target, "[data-image]");
      if (image && !closest(target, "[data-field]:not(img)") && !isLocked(image)) {
        var section = sectionOf(image);
        var item = itemOf(image);
        post({ type: "4eos-menu", action: "replace", sectionId: section ? section.getAttribute("data-section-id") : "", itemId: item ? item.getAttribute("data-item-id") : "", overlay: overlayOf(image) });
        return;
      }
      var field = closest(target, "[data-field], [data-blog-field], [data-blog-block]");
      if (field && canEditText(field)) { event.preventDefault(); beginEdit(field, event.clientX, event.clientY); return; }
      if (field && isLocked(field)) flash("This part is managed for you");
    });

    document.addEventListener("focusout", function (event) {
      if (!editing || event.target !== editing) return;
      var next = event.relatedTarget;
      if (next && fmt && fmt.contains(next)) return;
      setTimeout(function () {
        if (!editing) return;
        var active = document.activeElement;
        if (active === editing || (fmt && fmt.contains(active))) return;
        finishEdit();
      }, 0);
    });

    document.addEventListener("selectionchange", function () { if (editing) updateFmt(); });
    document.addEventListener("beforeinput", function (event) {
      if (!editing || !editing.contains(event.target)) return;
      if (event.inputType === "historyUndo" || event.inputType === "historyRedo") { event.preventDefault(); editUndo(event.inputType === "historyRedo"); return; }
      if (event.inputType === "formatBold" || event.inputType === "formatItalic" || event.inputType === "formatUnderline") { event.preventDefault(); return; }
      if (event.inputType === "insertParagraph" || event.inputType === "insertLineBreak") { event.preventDefault(); return; }
      remember(false);
    });
    document.addEventListener("input", function (event) { if (editing && editing.contains(event.target)) placeUi(fmt, editing); });
    document.addEventListener("paste", function (event) {
      if (!editing || !editing.contains(event.target)) return;
      event.preventDefault();
      var text = (event.clipboardData && event.clipboardData.getData("text/plain")) || "";
      var nl = String.fromCharCode(10);
      text = text.split(String.fromCharCode(13)).join("");
      if (!multiline(editing)) text = text.split(nl).join(" ");
      insertPlain(text);
    });
    document.addEventListener("drop", function (event) {
      if (editing && editing.contains(event.target)) event.preventDefault();
    }, true);

    document.addEventListener("contextmenu", function (event) {
      var target = event.target;
      if (!target || !target.closest || isUi(target)) return;
      if (editing && editing.contains(target)) return;
      var node = selectableFor(target);
      if (!node || isLocked(node)) return;
      event.preventDefault();
      if (node !== selected) select(node, false);
      openMenu(null, { x: event.clientX, y: event.clientY });
    });

    document.addEventListener("keydown", function (event) {
      var mod = event.metaKey || event.ctrlKey;
      var key = event.key;
      if (menu && menu.contains(event.target)) {
        var entries = Array.prototype.slice.call(menu.querySelectorAll("[role=menuitem]:not([disabled])"));
        var at = entries.indexOf(document.activeElement);
        if (key === "ArrowDown" || key === "ArrowUp") { event.preventDefault(); var step = key === "ArrowDown" ? 1 : -1; var next = entries[(at + step + entries.length) % entries.length]; if (next) next.focus(); return; }
        if (key === "Home" || key === "End") { event.preventDefault(); var edge = key === "Home" ? entries[0] : entries[entries.length - 1]; if (edge) edge.focus(); return; }
        if (key === "Escape" || key === "Tab") { event.preventDefault(); closeMenu(true); return; }
        if (key === "Enter" || key === " ") { event.preventDefault(); if (document.activeElement && document.activeElement.dataset.act) onUiAction(document.activeElement, event); return; }
        return;
      }
      if (fmt && fmt.contains(event.target) && key === "Escape") { event.preventDefault(); cancelLink(); return; }
      if (event.target && event.target.closest && event.target.closest(".eos-fmt")) return;
      if (editing) {
        if (key === "Escape") { event.preventDefault(); finishEdit(); return; }
        if (mod && (key === "z" || key === "Z")) { event.preventDefault(); editUndo(event.shiftKey); return; }
        if (mod && (key === "y" || key === "Y")) { event.preventDefault(); editUndo(true); return; }
        if (mod && editState && editState.rich && (key === "b" || key === "B")) { event.preventDefault(); applyFormat("bold"); return; }
        if (mod && editState && editState.rich && (key === "i" || key === "I")) { event.preventDefault(); applyFormat("italic"); return; }
        if (mod && editState && editState.rich && (key === "u" || key === "U")) { event.preventDefault(); applyFormat("underline"); return; }
        if (mod && editState && editState.rich && (key === "k" || key === "K")) { event.preventDefault(); openLinkInput(); return; }
        if (key === "Enter") {
          event.preventDefault();
          if (!multiline(editing) || mod) { finishEdit(); return; }
          insertPlain(String.fromCharCode(10));
          ensureEnd(editing);
          return;
        }
        return;
      }
      if (event.target && event.target.closest && event.target.closest("input, textarea, select, [contenteditable=true]")) return;
      if (drag && key === "Escape") { event.preventDefault(); endDrag(true); return; }
      if (mod && (key === "z" || key === "Z")) { event.preventDefault(); post({ type: "4eos-key", key: "z", shift: event.shiftKey }); return; }
      if (mod && (key === "y" || key === "Y")) { event.preventDefault(); post({ type: "4eos-key", key: "z", shift: true }); return; }
      if (key === "Escape") { if (selected) { event.preventDefault(); clearSelected(false); } return; }
      if (!selected) return;
      var c = caps(selected);
      if ((key === "Delete" || key === "Backspace") && c.remove) { event.preventDefault(); runAct("delete"); return; }
      if (mod && (key === "d" || key === "D") && c.duplicate) { event.preventDefault(); runAct("duplicate"); return; }
      if (key === "Enter" && c.edit) { event.preventDefault(); runAct("edit"); return; }
      if (event.altKey && (key === "ArrowUp" || key === "ArrowDown")) {
        event.preventDefault();
        if (isSection(selected)) moveSectionBy(key === "ArrowUp" ? -1 : 1);
        else if (c.reorder) moveBlockBy(key === "ArrowUp" ? -1 : 1);
        return;
      }
      if (c.freeform && key.indexOf("Arrow") === 0) {
        event.preventDefault();
        var amount = event.shiftKey ? 0.05 : 0.01;
        var dx = key === "ArrowLeft" ? -amount : key === "ArrowRight" ? amount : 0;
        var dy = key === "ArrowUp" ? -amount : key === "ArrowDown" ? amount : 0;
        var moving = selectedItems.length ? selectedItems : [selected];
        moving.forEach(function (node) { applyBox(node, H.nudgeBox(readBox(node), dx, dy)); });
        clearTimeout(window.__eosNudge);
        window.__eosNudge = setTimeout(function () {
          var lead = moving[0];
          post(placeMessage(lead, moving.slice(1).map(function (node) { return { node: node }; })));
        }, 350);
        placeBar();
        return;
      }
      if ((key === "g" || key === "G") && !mod) document.body.classList.toggle("eos-grid");
    });

    document.addEventListener("dragover", function (event) {
      var types = event.dataTransfer ? Array.prototype.slice.call(event.dataTransfer.types || []) : [];
      if (types.indexOf("application/x-4eos-library") >= 0) {
        event.preventDefault();
        var nodes = Array.prototype.slice.call(document.querySelectorAll(".eos-gap"));
        var best = null;
        nodes.forEach(function (node) {
          var top = node.getBoundingClientRect().top;
          if (!best || Math.abs(event.clientY - top) < Math.abs(event.clientY - best.getBoundingClientRect().top)) best = node;
        });
        nodes.forEach(function (node) { node.classList.toggle("is-hot", node === best); });
        return;
      }
      var zone = closest(event.target, "[data-image], [data-freeform], [data-drop]");
      if (zone) event.preventDefault();
    });
    document.addEventListener("dragleave", function (event) {
      if (event.relatedTarget === null) document.querySelectorAll(".eos-gap.is-hot").forEach(function (node) { node.classList.remove("is-hot"); });
    });
    document.addEventListener("drop", function (event) {
      var transfer = event.dataTransfer;
      if (!transfer) return;
      var libraryType = transfer.getData("application/x-4eos-library");
      if (libraryType) {
        event.preventDefault();
        var hot = document.querySelector(".eos-gap.is-hot");
        document.querySelectorAll(".eos-gap.is-hot").forEach(function (node) { node.classList.remove("is-hot"); });
        if (hot) post({ type: "4eos-insert-type", libraryType: libraryType, index: Number(hot.dataset.index), beforeId: hot.dataset.before || "" });
        return;
      }
      var zone = closest(event.target, "[data-image], [data-freeform], [data-drop]");
      if (!zone || !transfer.files || !transfer.files[0]) return;
      event.preventDefault();
      var file = transfer.files[0];
      if (!/^image\\/(png|jpeg|webp|svg\\+xml)$/.test(file.type)) { post({ type: "4eos-drop-error", name: file.name }); return; }
      var reader = new FileReader();
      var section = sectionOf(zone);
      var item = itemOf(zone);
      reader.onload = function () {
        post({
          type: "4eos-drop",
          sectionId: section ? section.getAttribute("data-section-id") : (zone.getAttribute("data-freeform") || ""),
          itemId: item ? item.getAttribute("data-item-id") : "",
          overlay: overlayOf(zone) || zone.getAttribute("data-drop") === "overlay" || zone.getAttribute("data-overlay") === "true",
          name: file.name,
          dataUrl: String(reader.result || ""),
        });
      };
      reader.readAsDataURL(file);
    });

    function schedulePlace() {
      if (reposition) return;
      reposition = requestAnimationFrame(function () { reposition = 0; placeBar(); });
    }
    var scrollPost = 0;
    window.addEventListener("scroll", function () {
      schedulePlace();
      clearTimeout(scrollPost);
      scrollPost = setTimeout(function () { post({ type: "4eos-scroll", path: location.pathname, y: window.scrollY }); }, 150);
    }, { passive: true });
    window.addEventListener("resize", schedulePlace);

    window.addEventListener("message", function (event) {
      if (event.origin !== origin || !event.data || typeof event.data !== "object") return;
      var data = event.data;
      if (data.type === "4eos-config") {
        if (typeof data.scale === "number" && data.scale > 0) scale = data.scale;
        clipboard = !!data.clipboard;
        if (typeof data.scrollY === "number" && data.scrollY > 0 && !window.__eosScrolled) { window.__eosScrolled = true; window.scrollTo(0, data.scrollY); }
        if (data.selection && data.selection.sectionId && !selected) {
          var section = document.querySelector('[data-section-id="' + data.selection.sectionId + '"]');
          var node = section && data.selection.itemId ? section.querySelector('[data-item-id="' + data.selection.itemId + '"]') : section;
          if (node) select(node, false, true);
        }
        placeBar();
      }
      if (data.type === "4eos-clear") { if (editing) finishEdit(); clearSelected(true); }
      if (data.type === "4eos-edit" && selected) runAct("edit");
      if (data.type === "4eos-select-node") {
        if (editing) finishEdit();
        var target = null;
        if (data.chrome) target = document.querySelector('[data-chrome="' + data.chrome + '"]');
        else if (data.sectionId) {
          var owner = document.querySelector('[data-section-id="' + data.sectionId + '"]');
          target = owner && data.itemId ? owner.querySelector('[data-item-id="' + data.itemId + '"]') : owner;
        }
        if (!target) { clearSelected(true); return; }
        select(target, false, true);
        var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
      }
    });

    function boot() {
      paint();
      post({ type: "4eos-ready", path: location.pathname });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    window.addEventListener("load", function () { setTimeout(paint, 80); });
    var scheduled = false;
    new MutationObserver(function (records) {
      if (scheduled) return;
      var relevant = records.some(function (record) {
        var target = record.target;
        if (target && target.closest && target.closest(".eos-ui, .eos-gap, .eos-editing")) return false;
        var changed = Array.prototype.slice.call(record.addedNodes).concat(Array.prototype.slice.call(record.removedNodes));
        return changed.some(function (node) {
          return !(node.nodeType === 1 && node.matches && node.matches(".eos-ui, .eos-gap, .eos-handle, .eos-guide, .eos-insert-line"));
        });
      });
      if (!relevant) return;
      scheduled = true;
      setTimeout(function () { scheduled = false; paint(); if (selected && !selected.isConnected) clearSelected(false); }, 80);
    }).observe(document.body || document.documentElement, { childList: true, subtree: true });
  })();`;
}
