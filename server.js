// Tiny Express server. Two endpoints call out to OpenAI and fal.ai with placeholder
// keys that the Islo gateway swaps to real credentials at egress.

const express = require("express");
const path = require("path");
const { getOpenAI, GPT_MODEL } = require("./src/openai");
const { getFal, IMAGE_MODEL, PORTRAIT_9_16 } = require("./src/fal");
const { SLOGAN_PROMPT, POSTER_PROMPT } = require("./src/prompts");

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
    openai_key_preview: (process.env.OPENAI_API_KEY || "").slice(0, 14) + "…",
    fal_key_preview: (process.env.FAL_KEY || "").slice(0, 14) + "…",
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

app.post("/api/poster", async (req, res) => {
  try {
    const fal = getFal();
    const brand = (req.body && req.body.brand) || "Acme";
    const r = await fal.subscribe(IMAGE_MODEL, {
      input: {
        prompt: POSTER_PROMPT(brand),
        image_size: PORTRAIT_9_16,
        num_images: 1,
        output_format: "png",
      },
      logs: false,
    });
    const imageUrl = r.data?.images?.[0]?.url;
    if (!imageUrl) throw new Error("no image url in fal response");
    res.json({ imageUrl });
  } catch (err) {
    console.error("/api/poster error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";
app.listen(port, host, () => {
  console.log(`listening on http://${host}:${port}`);
});
