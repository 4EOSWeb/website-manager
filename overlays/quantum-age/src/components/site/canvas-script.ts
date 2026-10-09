const LOCK =
  "This item isn't typically editable through the website editor. Please contact your website provider if you need changes made to this section.";

export function canvasScript(origin: string) {
  return `(function () {
    var origin = ${JSON.stringify(origin)};
    var LOCK = ${JSON.stringify(LOCK)};
    var selected = null;
    var selectedItems = [];
    var editing = null;
    var bar = null;
    var menu = null;
    var hotGap = null;

    function post(message) { window.parent.postMessage(message, origin); }
    function viewport() {
      if (window.innerWidth < 500) return "mobile";
      if (window.innerWidth < 1100) return "tablet";
      return "desktop";
    }
    function topSections() {
      return Array.prototype.filter.call(document.querySelectorAll("[data-section-id]"), function (node) {
        return !node.parentElement || !node.parentElement.closest("[data-section-id]");
      });
    }
    function sectionOf(node) {
      return node && node.closest ? node.closest("[data-section-id]") : null;
    }
    function itemOf(node) {
      return node && node.closest ? node.closest("[data-item-id]") : null;
    }
    function overlayOf(node) {
      var zone = node && node.closest ? node.closest("[data-freeform]") : null;
      return !!(zone && zone.getAttribute("data-overlay") === "true");
    }
    function ensureChrome() {
      if (!document.getElementById("eos-style")) {
        var style = document.createElement("style");
        style.id = "eos-style";
        style.textContent = ".eos-gap{position:relative;height:28px;margin:-14px 0;z-index:30;display:flex;align-items:center;justify-content:center}.eos-gap .eos-line{position:absolute;left:8%;right:8%;height:2px;background:#8C4A2F;transform:scaleX(0);transition:transform .18s ease}.eos-plus{position:relative;z-index:1;width:28px;height:28px;border:0;border-radius:999px;background:#8C4A2F;color:#fff;font:700 18px/1 sans-serif;opacity:0;transition:opacity .18s ease}.eos-gap:hover,.eos-gap.is-hot{height:42px}.eos-gap:hover .eos-plus,.eos-gap.is-hot .eos-plus,.eos-gap:focus-within .eos-plus{opacity:1}.eos-gap:hover .eos-line,.eos-gap.is-hot .eos-line{transform:scaleX(1)}.eos-selected{outline:2px solid #8C4A2F;outline-offset:4px}.eos-lock{position:absolute;top:8px;left:8px;z-index:40;display:inline-flex;gap:6px;align-items:center;background:#1c1915;color:#fff;font:600 12px/1.2 sans-serif;padding:6px 8px;pointer-events:none}.eos-lock:before{content:'';width:10px;height:8px;border:2px solid #fff;border-top:0;display:inline-block;box-shadow:inset 0 8px 0 -6px #fff}.eos-bar,.eos-menu{position:fixed;z-index:70;display:flex;gap:4px;background:#fff;border:1px solid #ddd6cb;padding:4px;box-shadow:0 8px 24px rgba(28,25,21,.12)}.eos-bar button,.eos-menu button{border:0;background:transparent;padding:6px 8px;font:600 12px/1 sans-serif;color:#1c1915}.eos-bar button:hover,.eos-menu button:hover{background:#f4f1eb}.eos-handle{position:absolute;width:10px;height:10px;background:#fff;border:2px solid #8C4A2F;right:-6px;bottom:-6px;cursor:nwse-resize}[data-hidden=true]{opacity:.55}";
        document.head.appendChild(style);
      }
      document.querySelectorAll("[data-locked=provider]").forEach(function (node) {
        if (node.querySelector(":scope > .eos-lock")) return;
        var current = window.getComputedStyle(node).position;
        if (current === "static") node.style.position = "relative";
        var badge = document.createElement("span");
        badge.className = "eos-lock";
        badge.textContent = "Managed for you";
        badge.title = LOCK;
        node.appendChild(badge);
      });
    }
    function paint() {
      if (document.querySelector("[data-lock-copy]")) {
        ensureChrome();
        return;
      }
      ensureChrome();
      var sections = topSections();
      if (document.querySelectorAll(".eos-gap").length === sections.length + 1) return;
      document.querySelectorAll(".eos-gap").forEach(function (node) { node.remove(); });
      sections.forEach(function (section, index) {
        section.parentNode.insertBefore(gap(index), section);
        if (index === sections.length - 1) section.parentNode.insertBefore(gap(index + 1), section.nextSibling);
      });
    }
    function gap(index) {
      var node = document.createElement("div");
      node.className = "eos-gap";
      node.dataset.index = String(index);
      node.innerHTML = '<div class="eos-line"></div><button class="eos-plus" type="button" aria-label="Add a section">+</button>';
      return node;
    }
    function clearSelected() {
      document.querySelectorAll(".eos-handle").forEach(function (node) { node.remove(); });
      document.querySelectorAll(".eos-selected").forEach(function (node) { node.classList.remove("eos-selected"); });
      if (bar) bar.remove();
      bar = null;
      selected = null;
      selectedItems = [];
    }
    function itemIds() {
      return selectedItems.map(function (node) { return node.getAttribute("data-item-id"); }).filter(Boolean);
    }
    function showBar(node, actions) {
      if (bar) bar.remove();
      bar = document.createElement("div");
      bar.className = "eos-bar";
      actions.forEach(function (action) {
        var button = document.createElement("button");
        button.type = "button";
        button.dataset.act = action[0];
        button.textContent = action[1];
        bar.appendChild(button);
      });
      document.body.appendChild(bar);
      var rect = node.getBoundingClientRect();
      bar.style.top = Math.max(8, rect.top - 40) + "px";
      bar.style.left = Math.max(8, rect.left) + "px";
    }
    function select(node, additive) {
      if (!node || node.closest("[data-locked=provider]")) {
        var locked = node && node.closest("[data-locked=provider]");
        clearSelected();
        if (locked) {
          locked.classList.add("eos-selected");
          selected = locked;
          var section = sectionOf(locked);
          post({ type: "4eos-select", sectionId: section ? section.getAttribute("data-section-id") : "", itemIds: [], locked: true });
        } else post({ type: "4eos-select", sectionId: "", itemIds: [], locked: false });
        return;
      }
      if (node.hasAttribute && node.hasAttribute("data-freeform") && node.getAttribute("data-overlay") === "true") {
        clearSelected();
        node.classList.add("eos-selected");
        selected = node;
        var overlaySection = sectionOf(node);
        post({
          type: "4eos-select",
          sectionId: overlaySection ? overlaySection.getAttribute("data-section-id") : "",
          itemId: "",
          itemIds: [],
          overlay: true,
          locked: false,
        });
        return;
      }
      var itemNode = node.getAttribute && node.getAttribute("data-item-id") ? node : null;
      if (additive && itemNode && selectedItems.length && selectedItems[0].closest("[data-freeform]") === itemNode.closest("[data-freeform]")) {
        var existing = selectedItems.indexOf(itemNode);
        if (existing >= 0) selectedItems.splice(existing, 1);
        else selectedItems.push(itemNode);
        document.querySelectorAll(".eos-selected").forEach(function (marked) { marked.classList.remove("eos-selected"); });
        selectedItems.forEach(function (marked) { marked.classList.add("eos-selected"); });
        selected = selectedItems[selectedItems.length - 1] || null;
        if (!selected) { clearSelected(); post({ type: "4eos-select", sectionId: "", itemIds: [], locked: false }); return; }
        node = selected;
      } else {
        clearSelected();
        node.classList.add("eos-selected");
        selected = node;
        if (itemNode) selectedItems = [itemNode];
      }
      var item = node.getAttribute("data-item-id") ? node : null;
      var sectionNode = sectionOf(node);
      var actions = item
        ? [["duplicate", "Duplicate"], ["hide", node.getAttribute("data-hidden") ? "Show" : "Hide"], ["lock", node.getAttribute("data-item-locked") ? "Unlock" : "Lock"], ["forward", "Forward"], ["back", "Back"], ["group", "Group"], ["delete", "Delete"]]
        : [["duplicate", "Duplicate"], ["up", "Move up"], ["down", "Move down"], ["hide", node.getAttribute("data-hidden") ? "Show" : "Hide"], ["delete", "Delete"], ["template", "Save as template"], ["drag", "Drag"]];
      if (sectionNode && sectionNode.getAttribute("data-section-type") === "designed") actions = [["hide", "Hide"], ["drag", "Drag"]];
      if (!item && sectionNode && sectionNode.getAttribute("data-locked") === "provider") actions = [];
      if (actions.length) showBar(node, actions);
      if (item) {
        var handle = document.createElement("button");
        handle.className = "eos-handle";
        handle.type = "button";
        handle.setAttribute("aria-label", "Resize");
        item.appendChild(handle);
      }
      post({
        type: "4eos-select",
        sectionId: sectionNode ? sectionNode.getAttribute("data-section-id") : "",
        itemId: item ? item.getAttribute("data-item-id") : "",
        itemIds: itemIds(),
        overlay: overlayOf(node),
        locked: false,
      });
    }
    function beginEdit(field) {
      if (!field || field.closest("[data-locked=provider]") || field.getAttribute("data-item-locked") === "true") return;
      editing = field;
      field.setAttribute("contenteditable", "true");
      field.focus();
      var range = document.createRange();
      range.selectNodeContents(field);
      range.collapse(false);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    function finishEdit() {
      if (!editing) return;
      var field = editing;
      var section = sectionOf(field);
      var item = itemOf(field);
      var name = field.getAttribute("data-field") || field.getAttribute("data-blog-field");
      field.removeAttribute("contenteditable");
      editing = null;
      if (field.getAttribute("data-blog-field") || field.getAttribute("data-blog-block")) {
        post({ type: "4eos-blog", field: field.getAttribute("data-blog-field") || "text", index: field.getAttribute("data-blog-block"), value: field.textContent || "" });
        return;
      }
      post({
        type: "4eos-text",
        sectionId: section ? section.getAttribute("data-section-id") : "",
        itemId: item ? item.getAttribute("data-item-id") : "",
        field: name || "text",
        value: field.textContent || "",
        overlay: overlayOf(field),
      });
    }
    function readBox(item) {
      var rect = item.getBoundingClientRect();
      var zone = item.closest("[data-freeform]");
      var zoneRect = zone.getBoundingClientRect();
      return {
        x: (rect.left - zoneRect.left) / zoneRect.width,
        y: (rect.top - zoneRect.top) / zoneRect.height,
        w: rect.width / zoneRect.width,
        h: rect.height / zoneRect.height,
      };
    }
    function applyBox(item, box) {
      var key = viewport() === "mobile" ? "m" : viewport() === "tablet" ? "t" : "d";
      item.style.setProperty("--" + key + "x", box.x);
      item.style.setProperty("--" + key + "y", box.y);
      item.style.setProperty("--" + key + "w", box.w);
      item.style.setProperty("--" + key + "h", box.h);
      if (key === "t") item.classList.add("has-tablet");
      if (key === "m") item.classList.add("has-mobile");
    }
    function snap(box, zone, item) {
      var width = zone.getBoundingClientRect().width || 1;
      var height = zone.getBoundingClientRect().height || 1;
      var thresholdX = 8 / width;
      var thresholdY = 8 / height;
      function near(a, b, t) { return Math.abs(a - b) < t; }
      var guides = [0, 0.5, 1];
      guides.forEach(function (guide) {
        if (near(box.x, guide, thresholdX)) box.x = guide;
        if (near(box.x + box.w, guide, thresholdX)) box.x = guide - box.w;
        if (near(box.x + box.w / 2, guide, thresholdX)) box.x = guide - box.w / 2;
        if (near(box.y, guide, thresholdY)) box.y = guide;
        if (near(box.y + box.h, guide, thresholdY)) box.y = guide - box.h;
        if (near(box.y + box.h / 2, guide, thresholdY)) box.y = guide - box.h / 2;
      });
      zone.querySelectorAll("[data-item-id]").forEach(function (other) {
        if (other === item) return;
        var otherBox = readBox(other);
        if (near(box.x, otherBox.x, thresholdX)) box.x = otherBox.x;
        if (near(box.y, otherBox.y, thresholdY)) box.y = otherBox.y;
        if (near(box.x + box.w, otherBox.x, thresholdX)) box.x = otherBox.x - box.w;
        if (near(box.y + box.h, otherBox.y, thresholdY)) box.y = otherBox.y - box.h;
      });
      box.x = Math.max(0, Math.min(1 - box.w, box.x));
      box.y = Math.max(0, Math.min(1 - box.h, box.y));
      return box;
    }
    var drag = null;
    document.addEventListener("pointerdown", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      var act = target.closest("[data-act]");
      if (act && act.dataset.act === "drag") {
        var section = selected && selected.getAttribute("data-section-id") ? selected : sectionOf(selected);
        if (!section) return;
        var sections = topSections();
        drag = { kind: "section", from: sections.indexOf(section) };
        event.preventDefault();
        return;
      }
      var handle = target.closest(".eos-handle");
      var item = itemOf(target);
      if ((handle || item) && item && item.getAttribute("data-item-locked") !== "true" && !editing) {
        var box = readBox(item);
        var group = item.getAttribute("data-group");
        var fellows = [];
        if (group) {
          item.closest("[data-freeform]").querySelectorAll('[data-group="' + group + '"]').forEach(function (fellow) {
            if (fellow !== item) fellows.push({ node: fellow, box: readBox(fellow) });
          });
        }
        drag = { kind: handle ? "resize" : "item", item: item, box: box, x: event.clientX, y: event.clientY, fellows: fellows };
        event.preventDefault();
      }
    });
    document.addEventListener("pointermove", function (event) {
      if (!drag) return;
      if (drag.kind === "section") {
        document.querySelectorAll(".eos-gap").forEach(function (node) { node.classList.remove("is-hot"); });
        var under = document.elementFromPoint(event.clientX, event.clientY);
        var gapNode = under && under.closest ? under.closest(".eos-gap") : null;
        if (gapNode) {
          gapNode.classList.add("is-hot");
          hotGap = gapNode;
        }
        return;
      }
      var zone = drag.item.closest("[data-freeform]");
      var rect = zone.getBoundingClientRect();
      var dx = (event.clientX - drag.x) / (rect.width || 1);
      var dy = (event.clientY - drag.y) / (rect.height || 1);
      var next = { x: drag.box.x, y: drag.box.y, w: drag.box.w, h: drag.box.h };
      if (drag.kind === "resize") {
        next.w = Math.max(0.08, drag.box.w + dx);
        next.h = Math.max(0.08, drag.box.h + dy);
      } else {
        next.x = drag.box.x + dx;
        next.y = drag.box.y + dy;
        next = snap(next, zone, drag.item);
      }
      applyBox(drag.item, next);
      var movedX = next.x - drag.box.x;
      var movedY = next.y - drag.box.y;
      drag.fellows.forEach(function (fellow) {
        applyBox(fellow.node, snap({ x: fellow.box.x + movedX, y: fellow.box.y + movedY, w: fellow.box.w, h: fellow.box.h }, zone, fellow.node));
      });
      drag.latest = next;
    });
    document.addEventListener("pointerup", function () {
      if (!drag) return;
      if (drag.kind === "section" && hotGap) {
        post({ type: "4eos-move", from: drag.from, to: Number(hotGap.dataset.index) });
      }
      if ((drag.kind === "item" || drag.kind === "resize") && drag.latest) {
        var zone = drag.item.closest("[data-freeform]");
        var items = [{ id: drag.item.getAttribute("data-item-id"), placement: readBox(drag.item) }];
        drag.fellows.forEach(function (fellow) {
          items.push({ id: fellow.node.getAttribute("data-item-id"), placement: readBox(fellow.node) });
        });
        post({
          type: "4eos-place",
          sectionId: zone.getAttribute("data-freeform"),
          overlay: zone.getAttribute("data-overlay") === "true",
          viewport: viewport(),
          items: items,
        });
      }
      drag = null;
      hotGap = null;
    });
    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      var action = target.closest("[data-act]");
      if (action && selected) {
        event.preventDefault();
        var section = sectionOf(selected);
        var item = itemOf(selected);
        post({
          type: "4eos-action",
          action: action.dataset.act,
          sectionId: section ? section.getAttribute("data-section-id") : "",
          itemId: item ? item.getAttribute("data-item-id") : "",
          itemIds: itemIds(),
          overlay: overlayOf(selected),
        });
        return;
      }
      var plus = target.closest(".eos-plus");
      if (plus) {
        event.preventDefault();
        post({ type: "4eos-insert", index: Number(plus.parentNode.dataset.index) });
        return;
      }
      var choice = target.closest(".eos-menu button");
      if (choice) {
        event.preventDefault();
        post({ type: "4eos-menu", action: choice.dataset.menu, sectionId: menu.dataset.section, itemId: menu.dataset.item, overlay: menu.dataset.overlay === "true" });
        menu.remove();
        menu = null;
        return;
      }
      if (menu) { menu.remove(); menu = null; }
      var zoneHit = target.closest("[data-zone-hit]");
      if (zoneHit) {
        event.preventDefault();
        select(zoneHit.closest("[data-freeform]"));
        return;
      }
      var lockedHit = target.closest("[data-locked=provider]");
      if (lockedHit) {
        event.preventDefault();
        select(lockedHit);
        return;
      }
      var link = target.closest("a[href]");
      var field = target.closest("[data-field], [data-item-id], [data-section-id], [data-image]");
      if (field && (target.closest("[data-field]") || target.closest("[data-item-id]") || target.closest("[data-section-id]"))) {
        if (link && target.closest("[data-field], [data-item-id], [data-section-id]")) {
          event.preventDefault();
          event.stopPropagation();
        }
        var item = itemOf(target);
        select(item || sectionOf(target) || field, event.shiftKey && !!item);
        return;
      }
      if (link) {
        var url;
        try { url = new URL(link.href, window.location.href); } catch (error) { return; }
        if (url.origin !== window.location.origin) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        post({ type: "4eos-navigate", path: url.pathname + url.search + url.hash });
      }
    }, true);
    document.addEventListener("dblclick", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      var image = target.closest("[data-image]");
      if (image && !target.closest("[data-field]")) {
        var section = sectionOf(image);
        var item = itemOf(image);
        post({ type: "4eos-menu", action: "replace", sectionId: section ? section.getAttribute("data-section-id") : "", itemId: item ? item.getAttribute("data-item-id") : "", overlay: overlayOf(image) });
        return;
      }
      var field = target.closest("[data-field], [data-blog-field], [data-blog-block]");
      if (field) beginEdit(field);
    });
    document.addEventListener("focusout", function (event) {
      if (editing && event.target === editing) finishEdit();
    });
    document.addEventListener("contextmenu", function (event) {
      var image = event.target && event.target.closest ? event.target.closest("[data-image]") : null;
      if (!image) return;
      event.preventDefault();
      if (menu) menu.remove();
      var section = sectionOf(image);
      var item = itemOf(image);
      menu = document.createElement("div");
      menu.className = "eos-menu";
      menu.dataset.section = section ? section.getAttribute("data-section-id") : "";
      menu.dataset.item = item ? item.getAttribute("data-item-id") : "";
      menu.dataset.overlay = overlayOf(image) ? "true" : "false";
      ["replace:Replace", "duplicate:Duplicate", "delete:Delete", "alt:Edit alt text", "crop:Crop"].forEach(function (entry) {
        var parts = entry.split(":");
        var button = document.createElement("button");
        button.type = "button";
        button.dataset.menu = parts[0];
        button.textContent = parts[1];
        menu.appendChild(button);
      });
      document.body.appendChild(menu);
      menu.style.top = event.clientY + "px";
      menu.style.left = event.clientX + "px";
    });
    document.addEventListener("dragover", function (event) {
      var zone = event.target && event.target.closest ? event.target.closest("[data-image], [data-freeform], [data-drop]") : null;
      if (!zone) return;
      event.preventDefault();
    });
    document.addEventListener("drop", function (event) {
      var zone = event.target && event.target.closest ? event.target.closest("[data-image], [data-freeform], [data-drop]") : null;
      if (!zone || !event.dataTransfer || !event.dataTransfer.files || !event.dataTransfer.files[0]) return;
      event.preventDefault();
      var file = event.dataTransfer.files[0];
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
    document.addEventListener("keydown", function (event) {
      if ((event.key === "z" || event.key === "Z") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        post({ type: "4eos-key", key: "z", shift: event.shiftKey });
        return;
      }
      if (event.key === "Escape") {
        if (editing) editing.blur();
        clearSelected();
        post({ type: "4eos-select", sectionId: "" });
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        if (editing || (event.target && event.target.closest && event.target.closest("input, textarea, [contenteditable=true]"))) return;
        if (!selected) return;
        event.preventDefault();
        var section = sectionOf(selected);
        var item = itemOf(selected);
        post({ type: "4eos-action", action: "delete", sectionId: section ? section.getAttribute("data-section-id") : "", itemId: item ? item.getAttribute("data-item-id") : "", overlay: overlayOf(selected) });
      }
    });
    function boot() { paint(); }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    window.addEventListener("load", function () { setTimeout(paint, 80); });
    var scheduled = false;
    new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      setTimeout(function () { scheduled = false; paint(); }, 80);
    }).observe(document.documentElement, { childList: true, subtree: true });
  })();`;
}
