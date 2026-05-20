// Cached fal.ai client. Same Islo phantom pattern as src/openai.js — locally
// set FAL_KEY in .env.local; in a sandbox the helper derives
// `islo_phantom_<sandbox-id>_fal` for the gateway to swap at egress.

const { fal } = require("@fal-ai/client");
const { isloPhantom } = require("./islo-phantom");

let configured = false;

function getFalKey() {
  return process.env.FAL_KEY || isloPhantom("fal");
}

function getFal() {
  if (!configured) {
    const credentials = getFalKey();
    if (!credentials) {
      throw new Error(
        "Missing FAL_KEY and no Islo phantom available (no GITHUB_TOKEN, CURSOR_API_KEY, etc. set)"
      );
    }
    fal.config({ credentials });
    configured = true;
  }
  return fal;
}

const IMAGE_MODEL = "openai/gpt-image-2";
const EDIT_IMAGE_MODEL = "openai/gpt-image-2/edit";
const PORTRAIT_9_16 = { width: 1152, height: 2048 };

module.exports = { getFal, IMAGE_MODEL, EDIT_IMAGE_MODEL, PORTRAIT_9_16, getFalKey };
