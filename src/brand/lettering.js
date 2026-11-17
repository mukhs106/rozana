// The only place the brand name and the lettering asset live.
// Drop a licensed script face in src/index.css (--font-display) or point
// assetUrl at an uploaded SVG/PNG of the wordmark and the header follows.
export const DISPLAY_NAME = "Rozana";

export const LETTERING = {
  // e.g. "https://media.base44.com/.../wordmark.svg" once a final asset exists
  assetUrl: null,
  fontToken: "var(--font-display)",
  slant: "-1.4deg",
  rough: true,
};

// The brushed monogram that sits left of the wordmark.
export const MONOGRAM = {
  letter: "R",
  assetUrl: null,
};