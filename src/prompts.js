// System / user prompts for the two AI calls. Slim versions of Brand-Creator's
// prompts.ts — just enough to demonstrate the end-to-end loop.

const SLOGAN_PROMPT = `You are a creative director. Given a brand name, write ONE
memorable, single-line slogan that captures its essence. Return just the slogan
text, no quotes, no preamble, no explanation. Maximum 10 words.`;

function POSTER_PROMPT(brand) {
  return (
    `A bold, modern brand poster for "${brand}". Strong typography featuring the ` +
    `brand name. Vibrant, distinctive color palette. Clean composition suitable ` +
    `for a 9:16 portrait poster. High quality, polished design.`
  );
}

module.exports = { SLOGAN_PROMPT, POSTER_PROMPT };
