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
  status.textContent = "generating (this can take ~20s)…";
  img.removeAttribute("src");
  try {
    const r = await fetch("/api/poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: brand() }),
    });
    const d = await r.json();
    if (d.imageUrl) {
      img.src = d.imageUrl;
      status.textContent = "done.";
    } else {
      status.textContent = "(error: " + (d.error || "no image") + ")";
    }
  } catch (err) {
    status.textContent = "request failed: " + err.message;
  } finally {
    btn.disabled = false;
  }
});
