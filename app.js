/* IronClaw · Agent Monitor — concept interactions (vanilla, no deps) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = n => "$" + n.toLocaleString("en-US");

  /* ---- Pending action state: one source of truth, governed by the dial ---- */
  const PEND_AMT = 42000;       // the live pending action's size
  let pendingTerminal = false;  // true once the user has approved/declined (dial can't override)
  let pendChip = null;
  function pendChipEl() {
    if (!pendChip) { pendChip = document.createElement("span"); pendChip.hidden = true; $("#pendingDesc").after(pendChip); }
    return pendChip;
  }
  // dial-driven, reversible: armed (needs approval) <-> auto (within the dial)
  function setPending(state) {
    if (pendingTerminal) return;
    const dot = $("#pendingDot"), chip = pendChipEl();
    if (state === "auto") {
      dot.className = "dot dot-green tl-dot";
      $("#pendingHead").textContent = "Auto-approved — within your trust dial";
      $("#pendingDesc").innerHTML = "Cleared <strong>$42,000 USDC → ETH</strong> automatically — under your " + money(threshold) + " dial. Logged for you.";
      $("#openPreflight").hidden = true; $("#taskAlert").hidden = true;
      chip.hidden = false; chip.className = "chip chip-ok"; chip.innerHTML = '<span class="chip-dot"></span>Ambient';
    } else {
      dot.className = "dot dot-amber tl-dot";
      $("#pendingHead").textContent = "Holding for your approval — high-stakes intent";
      $("#pendingDesc").innerHTML = "Swap <strong>$42,000 USDC → ETH</strong> to correct a 7% drift. Above your trust threshold, so Atlas paused itself.";
      $("#openPreflight").hidden = false; $("#taskAlert").hidden = false;
      chip.hidden = true;
    }
  }
  // terminal: the user explicitly approved or declined
  function resolveTask(state) {
    if (pendingTerminal) return;
    pendingTerminal = true;
    const dot = $("#pendingDot"), chip = pendChipEl();
    $("#taskAlert").hidden = true; $("#openPreflight").hidden = true;
    if (state === "approved") {
      const executed = Math.min(+$("#cap").value, PEND_AMT);   // a cap above the trade size can't make it bigger
      const amt = money(executed), paused = $("#pauseAfter").checked;
      dot.className = "dot dot-green tl-dot";
      $("#pendingHead").textContent = "Executed — you approved";
      $("#pendingDesc").innerHTML = `Swapped <strong>${amt}</strong> USDC → ETH via the winning solver · 0.21% slippage · settled on NEAR.`;
      chip.hidden = false; chip.className = "chip chip-ok"; chip.innerHTML = '<span class="chip-dot"></span>Signed';
      toast(`✓ Signed. ${amt} routed to the winning solver.${paused ? " Atlas paused." : ""}`);
      // Opt-in: let this in-loop decision OPTIONALLY become standing policy.
      // Never silent — silently raising the dial would widen autonomy without consent.
      const promo = document.createElement("button");
      promo.className = "btn btn-link btn-sm promote-btn";
      promo.innerHTML = `Raise auto-approve to ${amt} so similar moves don't need review →`;
      promo.addEventListener("click", () => {
        setThreshold(executed);                       // animates the Trust Dial to the approved amount
        toast(`Auto-approve raised to ${amt}. Trust Dial updated.`);
        const done = document.createElement("span");
        done.className = "promote-done";
        done.textContent = `✓ Auto-approve raised to ${amt} — future moves under this clear ambiently.`;
        promo.replaceWith(done);
      });
      $("#pendingDesc").parentNode.appendChild(promo);
    } else {
      dot.className = "dot dot-red tl-dot";
      $("#pendingHead").textContent = "Declined — Atlas paused";
      $("#pendingDesc").innerHTML = "You declined the intent. Nothing was signed; Atlas is holding.";
      chip.hidden = true;
      toast("Intent declined. Atlas stays paused — nothing signed.");
    }
  }

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
    // 180° gauge: every sub-arc is < 180°, so large-arc-flag is always 0.
    // (Setting it to 1 makes SVG take the long way around — the balloon bug.)
    gFill.setAttribute("d", `M20 120 A100 100 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`);
    gKnob.setAttribute("cx", x.toFixed(1)); gKnob.setAttribute("cy", y.toFixed(1));
    gVal.textContent = money(threshold);
    gauge.setAttribute("aria-valuenow", threshold);
    gauge.setAttribute("aria-valuetext", money(threshold) + (threshold === 0 ? ", everything needs approval" : ""));
    markerEls.forEach(m => m.c.setAttribute("class", "g-marker " + (m.amt <= threshold ? "is-ambient" : "is-preflight")));
    setPending(threshold >= PEND_AMT ? "auto" : "armed");   // the dial governs the live action
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
      out.innerHTML = `<span style="color:var(--success)">✓ ${money(amt)} — ambient.</span> Under your ${money(threshold)} dial, so Atlas just acts and logs it.`;
      toast(`✓ ${money(amt)} cleared ambiently — below your trust dial.`);
    } else if (amt === PEND_AMT) {
      out.innerHTML = `<span style="color:var(--warning)">⏸ ${money(amt)} — pre-flight.</span> Above your ${money(threshold)} dial — opening the review surface.`;
      openPreflight();
    } else {
      out.innerHTML = `<span style="color:var(--warning)">⏸ ${money(amt)} — pre-flight.</span> Above your ${money(threshold)} dial, so Atlas would hold for your sign-off.`;
      toast(`⏸ ${money(amt)} would need a pre-flight — above your trust dial.`);
    }
  }));

  /* ---- Pre-flight dialog ---- */
  const overlay = $("#overlay"), pf = $("#preflight");
  const openPreflight = () => { overlay.hidden = false; pf.hidden = false; renderPreflight(); };
  const closePreflight = () => { overlay.hidden = true; pf.hidden = true; };
  window.openPreflight = openPreflight;
  $("#openPreflight").addEventListener("click", openPreflight);
  $("#alertReview").addEventListener("click", openPreflight);
  $("#pfClose").addEventListener("click", closePreflight);
  $("#pfDecline").addEventListener("click", () => { closePreflight(); resolveTask("declined"); });
  $("#pfApprove").addEventListener("click", () => { closePreflight(); resolveTask("approved"); });
  overlay.addEventListener("click", closePreflight);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closePreflight(); });

  /* ---- Pre-flight levers: outcomes change with your limits ---- */
  const TRADE = 42000, WIN_SLIP = 21;   // winning quote = 0.21%, slider in 1/100 %
  const cap = $("#cap"), capVal = $("#capVal"), capNote = $("#capNote");
  const slip = $("#slip"), slipVal = $("#slipVal"), slipNote = $("#slipNote");
  const approve = $("#pfApprove");

  function renderPreflight() {
    const c = +cap.value, s = +slip.value;
    capVal.textContent = money(c);
    slipVal.textContent = (s / 100).toFixed(2) + "%";

    if (c >= TRADE) { capNote.className = "lever-note ok"; capNote.textContent = "Full " + money(TRADE) + " will execute."; }
    else { capNote.className = "lever-note warn"; capNote.textContent = "Below trade size — Atlas partial-fills to " + money(c) + "."; }

    // The cap is a consequence, not a label: reflect it in the resolved action AND
    // every solver's output (a smaller swap returns proportionally less ETH).
    const exec = Math.min(c, TRADE), scale = exec / TRADE, eth = e => e.toFixed(2) + " ETH";
    $("#pfResolvedAmt").textContent = exec.toLocaleString("en-US");
    $("#solvOutB").textContent = eth(12.84 * scale);
    $("#solvOutA").textContent = eth(12.83 * scale);
    $("#solvOutD").textContent = eth(12.79 * scale);
    const dlt = base => { const v = (base - 12.84) * scale; return Math.abs(v) < 0.005 ? "≈ best" : "−" + Math.abs(v).toFixed(2) + " ETH"; };
    $("#solvDeltaA").textContent = dlt(12.83);
    $("#solvDeltaD").textContent = dlt(12.79);

    const qualifies = s >= WIN_SLIP;
    if (qualifies) { slipNote.className = "lever-note ok"; slipNote.textContent = "Best quote 0.21% sits within your " + (s / 100).toFixed(2) + "% cap."; }
    else { slipNote.className = "lever-note warn"; slipNote.textContent = "No solver meets ≤" + (s / 100).toFixed(2) + "%. Atlas will hold — nothing executes."; }

    approve.disabled = !qualifies;
    approve.textContent = qualifies ? "Approve & sign" : "No quote qualifies";
  }
  cap.addEventListener("input", renderPreflight);
  slip.addEventListener("input", renderPreflight);

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
