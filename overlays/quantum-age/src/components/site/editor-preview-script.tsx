export function EditorPreviewScript() {
  if (process.env.EDITOR_PREVIEW !== "1") return null;
  const origin = process.env.EDITOR_HUB_ORIGIN || "http://127.0.0.1:3210";
  const script = `(function () {
    var origin = ${JSON.stringify(origin)};
    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      var link = target.closest("a[href]");
      if (link) {
        var url;
        try { url = new URL(link.href, window.location.href); } catch (e) { return; }
        if (url.origin !== window.location.origin) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        window.parent.postMessage({ type: "4eos-navigate", path: url.pathname + url.search + url.hash }, origin);
        return;
      }
      var field = target.closest("[data-editable]");
      if (!field) return;
      event.preventDefault();
      var nodes = document.querySelectorAll("[data-editable]");
      for (var i = 0; i < nodes.length; i++) nodes[i].style.outline = "";
      field.style.outline = "2px solid #8C4A2F";
      field.style.outlineOffset = "4px";
      window.parent.postMessage({ type: "4eos-select", field: field.getAttribute("data-editable") }, origin);
    }, true);
  })();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
