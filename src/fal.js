// Cached fal.ai client. Same pattern as src/openai.js — placeholder env value
// lets the SDK initialize, and the Islo gateway injects the real
// `Authorization: Key <id>:<secret>` header at egress.

const { fal } = require("@fal-ai/client");

let configured = false;

function getFal() {
  if (!configured) {
    const credentials = process.env.FAL_KEY;
    if (!credentials) throw new Error("Missing FAL_KEY environment variable");
    fal.config({ credentials });
    configured = true;
  }
  return fal;
}

const IMAGE_MODEL = "openai/gpt-image-2";
const EDIT_IMAGE_MODEL = "openai/gpt-image-2/edit";
const PORTRAIT_9_16 = { width: 1152, height: 2048 };

module.exports = { getFal, IMAGE_MODEL, EDIT_IMAGE_MODEL, PORTRAIT_9_16 };
