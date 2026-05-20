// Tiny Express server. Two endpoints call out to OpenAI and fal.ai with placeholder
// keys that the Islo gateway swaps to real credentials at egress.

const express = require("express");
const path = require("path");
const { getOpenAI, GPT_MODEL, getOpenAIKey } = require("./src/openai");
const { getFal, IMAGE_MODEL, PORTRAIT_9_16, getFalKey } = require("./src/fal");
const { SLOGAN_PROMPT, POSTER_PROMPT } = require("./src/prompts");

// Preview an opaque token, hiding everything after the first ~16 chars.
function preview(s) {
  s = s || "";
  return s.length > 16 ? s.slice(0, 16) + "…" : s;
}

const app = express();
const startedAt = Date.now();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// /health — surfaces the (redacted) env values so the page can prove
// the sandbox holds only placeholders while the API calls below still succeed.
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
    // What the SDK actually sees in this process — typically an
    // `islo_phantom_<sandbox-id>_<provider>` token that the gateway swaps for
    // the real credential at egress. The fact that the API calls below
    // succeed despite the previews showing a phantom IS the demo.
    openai_key_preview: preview(getOpenAIKey()),
    fal_key_preview: preview(getFalKey()),
    model: GPT_MODEL,
  });
});

app.post("/api/slogan", async (req, res) => {
  try {
    const openai = getOpenAI();
    const brand = (req.body && req.body.brand) || "Acme";
    const r = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        { role: "system", content: SLOGAN_PROMPT },
        { role: "user", content: `Brand: ${brand}` },
      ],
    });
    const slogan = r.choices?.[0]?.message?.content?.trim() || "";
    res.json({ slogan });
  } catch (err) {
    console.error("/api/slogan error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Async poster generation — fal.subscribe blocks for the full image-gen time
// (60–120s for openai/gpt-image-2), which is longer than the Islo share proxy
// timeout. Instead we submit to the queue here (returns in ~0.3s) and let the
// client poll the status endpoint below.
app.post("/api/poster", async (req, res) => {
  try {
    const fal = getFal();
    const brand = (req.body && req.body.brand) || "Acme";
    const r = await fal.queue.submit(IMAGE_MODEL, {
      input: {
        prompt: POSTER_PROMPT(brand),
        image_size: PORTRAIT_9_16,
        num_images: 1,
        output_format: "png",
      },
    });
    res.json({ request_id: r.request_id });
  } catch (err) {
    console.error("/api/poster error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Status / result for a queued poster job. Returns one of:
//   { status: "IN_QUEUE",     queue_position }
//   { status: "IN_PROGRESS" }
//   { status: "COMPLETED",    imageUrl }
//   { status: "FAILED",       error }
app.get("/api/poster/:requestId", async (req, res) => {
  try {
    const fal = getFal();
    const { requestId } = req.params;
    const s = await fal.queue.status(IMAGE_MODEL, { requestId, logs: false });
    if (s.status === "COMPLETED") {
      const result = await fal.queue.result(IMAGE_MODEL, { requestId });
      const imageUrl = result.data?.images?.[0]?.url;
      return res.json({ status: "COMPLETED", imageUrl });
    }
    return res.json({
      status: s.status,
      queue_position: s.queue_position,
    });
  } catch (err) {
    console.error(`/api/poster/${req.params.requestId} error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";
app.listen(port, host, () => {
  console.log(`listening on http://${host}:${port}`);
});
