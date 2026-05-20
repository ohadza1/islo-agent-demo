// Tiny client — three fetch calls, no framework.

const el = (id) => document.getElementById(id);
const brand = () => el("brand-input").value.trim() || "Acme";

// On load: show env previews from /health.
fetch("/health")
  .then((r) => r.json())
  .then((d) => {
    el("env-output").textContent =
      `OPENAI_API_KEY  (preview):  ${d.openai_key_preview}\n` +
      `FAL_KEY         (preview):  ${d.fal_key_preview}\n` +
      `model:                      ${d.model}\n` +
      `uptime:                     ${d.uptimeSec}s`;
  })
  .catch((err) => {
    el("env-output").textContent = "health check failed: " + err.message;
  });

el("gen-slogan").addEventListener("click", async () => {
  const btn = el("gen-slogan");
  const out = el("slogan-output");
  btn.disabled = true;
  out.textContent = "generating…";
  try {
    const r = await fetch("/api/slogan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: brand() }),
    });
    const d = await r.json();
    out.textContent = d.slogan || `(error: ${d.error || "no output"})`;
  } catch (err) {
    out.textContent = "request failed: " + err.message;
  } finally {
    btn.disabled = false;
  }
});

el("gen-poster").addEventListener("click", async () => {
  const btn = el("gen-poster");
  const status = el("poster-status");
  const img = el("poster-output");
  btn.disabled = true;
  status.textContent = "submitting to fal queue…";
  img.removeAttribute("src");

  // Helper: surface whatever the response actually contains (works for our
  // error shape AND for Islo share-proxy errors like {code, message}).
  const errMsg = (d) => d.error || d.message || d.code || "unknown";

  try {
    // 1. Submit
    const r = await fetch("/api/poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: brand() }),
    });
    const d = await r.json();
    if (!d.request_id) {
      status.textContent = "(submit failed: " + errMsg(d) + ")";
      btn.disabled = false;
      return;
    }

    // 2. Poll status every 3s for up to ~3 min
    const startedAt = Date.now();
    const maxAttempts = 60;
    for (let i = 1; i <= maxAttempts; i++) {
      await new Promise((res) => setTimeout(res, 3000));
      const sr = await fetch(`/api/poster/${d.request_id}`);
      const sd = await sr.json();

      if (sd.status === "COMPLETED" && sd.imageUrl) {
        const elapsed = Math.round((Date.now() - startedAt) / 1000);
        img.src = sd.imageUrl;
        status.textContent = `done in ${elapsed}s.`;
        btn.disabled = false;
        return;
      }
      if (sd.error || sd.status === "FAILED") {
        status.textContent = "(generation failed: " + errMsg(sd) + ")";
        btn.disabled = false;
        return;
      }

      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      const pos = sd.queue_position;
      const posStr = pos !== undefined && pos !== null ? ` queue pos ${pos}` : "";
      status.textContent = `${sd.status || "polling"}${posStr} · ${elapsed}s elapsed`;
    }
    status.textContent = "(timed out after 3 min — check fal dashboard)";
  } catch (err) {
    status.textContent = "request failed: " + err.message;
  } finally {
    btn.disabled = false;
  }
});
