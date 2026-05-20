// Cached OpenAI client. Throws if the env var is missing — the Islo sandbox
// receives a placeholder string for OPENAI_API_KEY, which is enough for the
// SDK to initialize. The gateway substitutes the real bearer token at egress.

const OpenAI = require("openai");

let cached = null;

function getOpenAI() {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY environment variable");
  cached = new OpenAI({ apiKey });
  return cached;
}

const GPT_MODEL = "gpt-4.1-mini";

module.exports = { getOpenAI, GPT_MODEL };
