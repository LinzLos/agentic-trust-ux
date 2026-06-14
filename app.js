/* IronClaw · Agent Monitor — concept interactions (vanilla, no deps) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = n => "$" + n.toLocaleString("en-US");

  /* ---- Theme toggle ---- */
  const root = document.documentElement;
  $("#themeToggle").addEventListener("click", () => {
    root.classList.add("theme-swapping");
    const dark = root.getAttribute("data-theme") === "dark";
    root.setAttribute("data-theme", dark ? "light" : "dark");
    $("#themeToggle").textContent = dark ? "☀" : "☾";
    setTimeout(() => root.classList.remove("theme-swapping"), 240);
  });

  /* ---- Designer's cut ---- */
  $("#notesToggle").addEventListener("click", e => {
    const on = document.body.classList.toggle("notes-on");
    e.currentTarget.setAttribute("aria-pressed", String(on));
  });

  /* ---- Attestation Shield: legible <-> raw ---- */
  const legible = $("#shieldLegible"), raw = $("#shieldRaw");
  const setShield = mode => {
    const isRaw = mode === "raw";
    raw.hidden = !isRaw; legible.hidden = isRaw;
    $$(".seg-btn").forEach(b => b.classList.toggle("is-active", b.dataset.shield === mode));
  };
  $$("[data-shield]").forEach(b => b.addEventListener("click", () => setShield(b.dataset.shield)));

  /* ---- Activity: intent <-> raw logs (segmented, matches the Shield) ---- */
  $$("[data-log]").forEach(b => b.addEventListener("click", () => {
    const raw = b.dataset.log === "raw";
    $("#logs").hidden = !raw; $("#timeline").hidden = raw;
    $$("[data-log]").forEach(x => x.classList.toggle("is-active", x === b));
  }));

  /* ---- Trust Dial: radial gauge ---- */
  const MAX = 50000, STEP = 500, CX = 120, CY = 120, R = 100;
  const gauge = $("#gauge"), gFill = $("#gFill"), gKnob = $("#gKnob"), gVal = $("#gVal"), gMarkers = $("#gMarkers");
  let threshold = 1000;

  const pt = v => { const a = Math.PI * (1 - v / MAX); return [CX + R * Math.cos(a), CY - R * Math.sin(a)]; };

  // plot the two scenario markers once
  const SCENARIOS = [{ amt: 4, lbl: "$4" }, { amt: 42000, lbl: "$42k" }];
  const markerEls = SCENARIOS.map(s => {
    const [x, y] = pt(s.amt), [lx, ly] = (p => p)([CX + (R + 17) * Math.cos(Math.PI * (1 - s.amt / MAX)), CY - (R + 17) * Math.sin(Math.PI * (1 - s.amt / MAX))]);
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 4); c.setAttribute("class", "g-marker");
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", lx); t.setAttribute("y", ly + 3); t.setAttribute("text-anchor", "middle");
    t.setAttribute("class", "g-marker-lbl"); t.textContent = s.lbl;
    gMarkers.append(c, t);
    return { ...s, c };
  });

  function renderDial() {
    const [x, y] = pt(threshold);
    const laf = threshold / MAX > 0.5 ? 1 : 0;
    gFill.setAttribute("d", `M20 120 A100 100 0 ${laf} 1 ${x.toFixed(1)} ${y.toFixed(1)}`);
    gKnob.setAttribute("cx", x.toFixed(1)); gKnob.setAttribute("cy", y.toFixed(1));
    gVal.textContent = money(threshold);
    gauge.setAttribute("aria-valuenow", threshold);
    gauge.setAttribute("aria-valuetext", money(threshold) + (threshold === 0 ? ", everything needs approval" : ""));
    markerEls.forEach(m => m.c.setAttribute("class", "g-marker " + (m.amt <= threshold ? "is-ambient" : "is-preflight")));
    if ($("#dialVal")) $("#dialVal").textContent = money(threshold);
  }
  const setThreshold = v => { threshold = Math.max(0, Math.min(MAX, Math.round(v / STEP) * STEP)); renderDial(); };

  function valueFromPointer(clientX, clientY) {
    const r = gauge.querySelector(".gauge-svg").getBoundingClientRect();
    const ccx = r.left + (CX / 240) * r.width, ccy = r.top + (CY / 150) * r.height;
    let a = Math.atan2(ccy - clientY, clientX - ccx);
    if (a < 0) a = clientX < ccx ? Math.PI : 0;        // clamp below-center drags to the ends
    setThreshold((1 - a / Math.PI) * MAX);
  }

  let dragging = false;
  const svg = gauge.querySelector(".gauge-svg");
  svg.addEventListener("pointerdown", e => { dragging = true; svg.setPointerCapture(e.pointerId); valueFromPointer(e.clientX, e.clientY); });
  svg.addEventListener("pointermove", e => { if (dragging) valueFromPointer(e.clientX, e.clientY); });
  svg.addEventListener("pointerup", () => { dragging = false; });
  gauge.addEventListener("keydown", e => {
    const k = e.key;
    if (k === "ArrowRight" || k === "ArrowUp") setThreshold(threshold + STEP);
    else if (k === "ArrowLeft" || k === "ArrowDown") setThreshold(threshold - STEP);
    else if (k === "Home") setThreshold(0);
    else if (k === "End") setThreshold(MAX);
    else return;
    e.preventDefault();
  });
  renderDial();

  /* ---- Scenarios ---- */
  const out = $("#scenarioOut");
  $$(".scenario-btn").forEach(b => b.addEventListener("click", () => {
    const amt = +b.dataset.amount;
    if (amt <= threshold) {
      out.innerHTML = `<span style="color:var(--brand)">✓ ${money(amt)} — ambient.</span> Under your ${money(threshold)} dial, so Atlas just acts and logs it.`;
      toast(`✓ ${money(amt)} approved ambiently — below your trust dial.`);
    } else {
      out.innerHTML = `<span style="color:var(--warning)">⏸ ${money(amt)} — pre-flight.</span> Above your ${money(threshold)} dial, so it needs your sign-off.`;
      openPreflight();
    }
  }));

  /* ---- Pre-flight dialog ---- */
  const overlay = $("#overlay"), pf = $("#preflight");
  const openPreflight = () => { overlay.hidden = false; pf.hidden = false; };
  const closePreflight = () => { overlay.hidden = true; pf.hidden = true; };
  window.openPreflight = openPreflight;
  $("#openPreflight").addEventListener("click", openPreflight);
  $("#alertReview").addEventListener("click", openPreflight);
  $("#pfClose").addEventListener("click", closePreflight);

  /* close the loop: pending -> resolved, in the timeline + alert */
  function resolveTask(state) {
    const item = $("#pendingItem");
    if (!item || item.dataset.resolved) return;
    item.dataset.resolved = state;
    $("#taskAlert").hidden = true;
    const btn = $("#openPreflight"); if (btn) btn.remove();
    const dot = $("#pendingDot"), head = $("#pendingHead"), desc = $("#pendingDesc");
    if (state === "approved") {
      const paused = $("#pauseAfter").checked, amt = $("#capVal").textContent;
      dot.className = "dot dot-green tl-dot";
      head.textContent = "Executed — you approved";
      desc.innerHTML = `Swapped <strong>${amt}</strong> USDC → ETH via the winning solver · 0.21% slippage · settled on NEAR.`;
      const chip = document.createElement("span");
      chip.className = "chip chip-ok"; chip.innerHTML = '<span class="chip-dot"></span>Signed';
      desc.after(chip);
      toast(`✓ Signed. ${amt} routed to the winning solver.${paused ? " Atlas paused." : ""}`);
    } else {
      dot.className = "dot dot-red tl-dot";
      head.textContent = "Declined — Atlas paused";
      desc.innerHTML = "You declined the intent. Nothing was signed; Atlas is holding.";
      toast("Intent declined. Atlas stays paused — nothing signed.");
    }
  }
  $("#pfDecline").addEventListener("click", () => { closePreflight(); resolveTask("declined"); });
  $("#pfApprove").addEventListener("click", () => { closePreflight(); resolveTask("approved"); });
  overlay.addEventListener("click", closePreflight);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closePreflight(); });

  /* cap lever */
  const cap = $("#cap"), capVal = $("#capVal");
  cap.addEventListener("input", () => { capVal.textContent = money(+cap.value); });

  /* ---- Toast ---- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    requestAnimationFrame(() => t.classList.add("is-show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove("is-show");
      setTimeout(() => { t.hidden = true; }, 240);
    }, 3200);
  }
})();
