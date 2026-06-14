# IronClaw · Agent Monitor — making invisible trust legible

A concept exploration for the world NEAR AI is building: **sovereign agents that hold wallets,
move money, and run inside confidential hardware you can't see.** The guarantees are real but
invisible — so this prototype designs the missing UX vocabulary for *invisible trust*.

> Independent concept piece. Not affiliated with NEAR. Grounded in the public Staff Product
> Designer role and NEAR AI's stated surfaces (IronClaw, NEAR AI Cloud, GPU Marketplace, Agent Market).

## The problem

The role asks one hard question directly: *"How does a user visualize what their agent is doing in
the background… without being overwhelmed by technical logs?"* — and asks designers to build the
interfaces where humans *"provision, monitor, and trust autonomous AI agents with their data and
their money."* That's the brief this prototype answers.

## Three primitives

| Primitive | What it solves |
|---|---|
| **Attestation Shield** | Translates a TEE attestation quote (Intel TDX / NVIDIA Confidential Computing) into a glanceable "verified enclave" verdict — with the raw cryptographic proof one click away. Glanceable for owners, auditable for engineers. |
| **Trust Dial** | A radial gauge where trust is set *per action, not per app.* Drag the threshold and watch real scenarios ($4 inference vs. a $42k rebalance) fall into the **ambient** or **pre-flight** zone. Friction scales with stakes. |
| **Intent timeline + pre-flight** | Shows *what the agent is doing* (declarative intent, competing solvers, gas abstraction) instead of logs — raw trace one toggle away. High-stakes intents gate behind a pre-flight with manual levers (spend cap, pause-after). |

## Where this fits the stack

- **IronClaw platform** → agent monitor + pre-flight approval flow
- **NEAR AI Cloud / GPU Marketplace** → the Attestation Shield (TEEs, attestable compute)
- **Agentic UI & Intents** → legible timeline, declarative pre-flight, solver resolution
- **Design system** → built entirely on semantic tokens, so a single brand-token change re-flows everywhere

## Design stance

- **Legibility over logs.** Intent first; the machine trace is never the default.
- **Intervenability over automation-only.** Pause, cap, and override mid-flight — always.
- **Glanceable but auditable.** The Shield reads in a second; the proof stays reachable for the skeptic.
- **Web2 ease, Web3 sovereignty.** Keys stay yours; friction scales with the stakes.

Click **"Designer's cut"** in the top bar to reveal the Decision / Why / Trade-off behind each.

## Run it

No build step. It's plain HTML/CSS/JS on the [Tiny Wire](https://linzlos.github.io/tiny-wire/docs/index.html) design system.

```bash
python3 -m http.server 4317
# open http://localhost:4317
```

## Built on Tiny Wire

Every surface uses [Tiny Wire](https://linzlos.github.io/tiny-wire/docs/index.html) semantic tokens
(`--brand`, `--surface`, `--text-*`) and components — no hardcoded colors. The design system is the
stable contract between design and engineering; this prototype is a consumer of it.
See [CREDITS](CREDITS.md).
