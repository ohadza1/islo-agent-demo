// Islo gateway credential-injection helper.
//
// The Islo gateway swaps an outbound credential ONLY when the token matches the
// exact format `islo_phantom_<sandbox-id>_<provider>`. Islo auto-sets a few
// such phantoms in the sandbox env (GITHUB_TOKEN, CURSOR_API_KEY, etc.), but
// NOT for OpenAI / fal / Anthropic. We extract the <sandbox-id> from any of
// the auto-set phantoms and construct the matching token for the provider we
// need. The gateway then sees an `islo_phantom_<id>_<provider>` token in the
// outbound request and swaps it for the real, tenant-scoped integration key
// at egress — so the real key never enters the sandbox.

const SOURCES = [
  ["GITHUB_TOKEN", /^islo_phantom_(.+)_github$/],
  ["GH_TOKEN", /^islo_phantom_(.+)_github$/],
  ["CURSOR_API_KEY", /^islo_phantom_(.+)_cursor$/],
  ["SLACK_TOKEN", /^islo_phantom_(.+)_slack$/],
  ["GITLAB_TOKEN", /^islo_phantom_(.+)_gitlab$/],
  ["NPM_TOKEN", /^islo_phantom_(.+)_npm$/],
  ["LINEAR_API_KEY", /^islo_phantom_(.+)_linear$/],
];

function isloPhantom(provider) {
  for (const [name, re] of SOURCES) {
    const val = process.env[name];
    const m = val && val.match(re);
    if (m) return `islo_phantom_${m[1]}_${provider}`;
  }
  return null;
}

module.exports = { isloPhantom };
