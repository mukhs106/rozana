import { cn } from "@/lib/utils";
import { DISPLAY_NAME, LETTERING, MONOGRAM } from "@/brand/lettering";

/**
 * The app title as a replaceable lettering asset: a rough script face with a
 * slight slant and irregular ink edges from an SVG displacement filter. Swap
 * LETTERING in src/brand/lettering.js to drop in the final drawing.
 */
export default function Wordmark({ text, className }) {
  const label = text || DISPLAY_NAME;
  const style = {
    transform: `rotate(${LETTERING.slant})`,
    fontStyle: "italic",
    filter: LETTERING.rough ? "url(#rough-ink)" : undefined,
  };

  if (LETTERING.assetUrl) {
    return (
      <img src={LETTERING.assetUrl} alt={label} className={cn("h-[26px] w-auto", className)} style={style} />
    );
  }

  return (
    <span
      className={cn("inline-block font-display leading-[0.92] tracking-[0.005em] text-ink", className)}
      style={style}
    >
      {label}
    </span>
  );
}

/** The brushed R mark, drawn with the same rough ink as the wordmark. */
export function Monogram({ className }) {
  if (MONOGRAM.assetUrl) {
    return <img src={MONOGRAM.assetUrl} alt="Rozana" className={cn("h-9 w-9", className)} />;
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center font-display text-display italic leading-none text-oxblood",
        className,
      )}
      style={{ filter: "url(#rough-ink)", transform: "rotate(-3deg)" }}
    >
      {MONOGRAM.letter}
    </span>
  );
}

/** Filter definition: mount once per screen. */
export function RoughInk() {
  return (
    <svg className="pointer-events-none absolute h-0 w-0 overflow-hidden" aria-hidden="true" focusable="false">
      <defs>
        <filter id="rough-ink" x="-12%" y="-24%" width="124%" height="148%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="7" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}