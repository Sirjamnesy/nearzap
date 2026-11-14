/* NearZap Pay button. Paste on any site:
 *   <div class="nearzap-button" data-handle="ada" data-amount="25" data-label="Pay Ada"></div>
 *   <script async src="https://YOUR-NEARZAP-HOST/embed.js"></script>
 * Options: data-handle (required), data-amount (USD, optional prefill), data-label, data-theme="dark|light". */
(function () {
  var me = document.currentScript;
  var origin = me && me.src ? new URL(me.src).origin : "https://nearzap.vercel.app";
  var BOLT = '<svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true" style="flex:none"><polygon points="20,2.5 5.5,18.5 13.8,18.5 11.5,29.5" fill="#dafa9c"/><polygon points="20,2.5 18.2,13 26.5,13 11.5,29.5" fill="#2fd98b"/></svg>';
  function build(el) {
    var handle = (el.getAttribute("data-handle") || "").trim().toLowerCase();
    if (!handle || el.getAttribute("data-nz") === "1") return;
    el.setAttribute("data-nz", "1");
    var amount = parseFloat(el.getAttribute("data-amount") || "");
    var light = el.getAttribute("data-theme") === "light";
    var a = document.createElement("a");
    a.href = origin + "/u/" + encodeURIComponent(handle) + (amount > 0 ? "?amount=" + encodeURIComponent(String(amount)) : "");
    a.target = "_blank"; a.rel = "noopener";
    a.innerHTML = BOLT + "<span></span>";
    a.lastChild.textContent = (el.getAttribute("data-label") || "Pay with any crypto").slice(0, 40);
    var bg = light ? "#fff" : "#0f0f0f", fg = light ? "#0f0f0f" : "#dafa9c";
    a.style.cssText = "display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 20px;border-radius:999px;font:600 16px/1 system-ui,-apple-system,Segoe UI,sans-serif;text-decoration:none;cursor:pointer;transition:transform .12s;border:1.5px solid #0f0f0f;background:" + bg + ";color:" + fg;
    a.onmousedown = function () { a.style.transform = "scale(.97)"; };
    a.onmouseup = a.onmouseleave = function () { a.style.transform = ""; };
    el.appendChild(a);
  }
  function run() { var n = document.querySelectorAll(".nearzap-button"); for (var i = 0; i < n.length; i++) build(n[i]); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
