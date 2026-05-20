// Cached OpenAI client. In a local dev env, set OPENAI_API_KEY in .env.local.
// In an Islo sandbox, leave OPENAI_API_KEY UNSET — the helper derives the
// `islo_phantom_<sandbox-id>_openai` token that the gateway swaps for the real
// OpenAI key at egress. Either way the SDK gets a non-empty string and works.

const OpenAI = require("openai");
const { isloPhantom } = require("./islo-phantom");

let cached = null;

function getOpenAIKey() {
  return process.env.OPENAI_API_KEY || isloPhantom("openai");
}

function getOpenAI() {
  if (cached) return cached;
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY and no Islo phantom available (no GITHUB_TOKEN, CURSOR_API_KEY, etc. set)"
    );
  }
  cached = new OpenAI({ apiKey });
  return cached;
}

const GPT_MODEL = "gpt-4.1-mini";

module.exports = { getOpenAI, GPT_MODEL, getOpenAIKey };
