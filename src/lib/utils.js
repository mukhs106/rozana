import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach the class merger the five type sizes (tailwind.config.js → fontSize), so
// "text-body" counts as a size and never knocks out a text colour.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "title", "heading", "body", "small"] }],
    },
  },
});

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
