// Custom icon family drawn on one 24px grid: 2px strokes, round caps and joins,
// heavy silhouettes, low detail. One filled accent per shape so the family reads
// as a set at 20-24px beside the rough script title.

const shared = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
};

function Glyph({ className = "h-6 w-6", children }) {
  return (
    <svg {...shared} className={className}>
      {children}
    </svg>
  );
}

export function TodayIcon({ className }) {
  return (
    <Glyph className={className}>
      <path d="M3.2 18.4h17.6" />
      <path d="M6.2 18.4a5.8 5.8 0 0 1 11.6 0" />
      <circle cx="12" cy="7.4" r="1.6" fill="currentColor" stroke="none" />
      <path d="M5.4 6.6 7 8.2" />
      <path d="M18.6 6.6 17 8.2" />
    </Glyph>
  );
}

export function RecipesIcon({ className }) {
  return (
    <Glyph className={className}>
      <path d="M3.8 10.6h16.4" />
      <path d="M5.4 10.6c0 4.7 3 8 6.6 8s6.6-3.3 6.6-8" />
      <path d="M9.6 7.4c1.2-1 .3-2.5-.3-3.6" />
      <path d="M13.6 7.4c1.2-1 .3-2.5-.3-3.6" />
    </Glyph>
  );
}

export function PlanIcon({ className }) {
  return (
    <Glyph className={className}>
      <rect x="3.4" y="5.4" width="17.2" height="15" rx="4" />
      <path d="M3.4 10.4h17.2" />
      <path d="M8.6 3.4v2.6" />
      <path d="M15.4 3.4v2.6" />
      <circle cx="8.6" cy="14.6" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12.6 14.7h4.6" />
    </Glyph>
  );
}

export function ProfileIcon({ className }) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="8.6" r="3.9" />
      <path d="M4.9 20.2c.7-3.7 3.6-5.9 7.1-5.9s6.4 2.2 7.1 5.9" />
    </Glyph>
  );
}

export function SwapIcon({ className }) {
  return (
    <Glyph className={className}>
      <path d="M4 9.4h13.2" />
      <path d="M14.2 6.2 17.8 9.4l-3.6 3.2" />
      <path d="M20 14.6H6.8" />
      <path d="M9.8 11.4 6.2 14.6l3.6 3.2" />
    </Glyph>
  );
}

export function PortionIcon({ className }) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 3.6v8.4" />
      <path d="M12 12l7.3 4.2" />
      <path d="M12 3.6A8.4 8.4 0 0 1 19.3 16.2L12 12Z" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

export function ShoppingListIcon({ className }) {
  return (
    <Glyph className={className}>
      <path d="M4.6 8.6h14.8l-1 10.1a2.4 2.4 0 0 1-2.4 2.1H8a2.4 2.4 0 0 1-2.4-2.1L4.6 8.6Z" />
      <path d="M8.8 8.6V6.9a3.2 3.2 0 0 1 6.4 0v1.7" />
      <path d="M9.4 13.6l1.9 1.9 3.5-3.7" />
    </Glyph>
  );
}

export function PlateIcon({ className }) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="5.4" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

export function LunchboxIcon({ className }) {
  return (
    <Glyph className={className}>
      <rect x="3.6" y="9" width="16.8" height="11.2" rx="2.8" />
      <path d="M8.4 9V7.7a2 2 0 0 1 2-2h3.2a2 2 0 0 1 2 2V9" />
      <path d="M3.6 13.4h16.8" />
      <circle cx="12" cy="16.4" r="1.4" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

export function FlameIcon({ className }) {
  return (
    <Glyph className={className}>
      <path d="M12 21c3.6 0 6.2-2.4 6.2-5.6 0-2.5-1.4-4-2.6-5.3-1.1-1.2-2.2-2.4-2.2-4.4-2.2 1.2-3.3 3.2-3.3 5 0 .9.2 1.5.2 1.5-1-.4-1.7-1.2-2-2.1C7 11.5 5.8 13.4 5.8 15.4 5.8 18.6 8.4 21 12 21Z" />
    </Glyph>
  );
}