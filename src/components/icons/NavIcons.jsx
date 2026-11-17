// Filled counterparts of the four tab marks, on the same 24px grid as the
// outlined set. The selected tab swaps to these; the label carries the rest.

const box = { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" };

export function TodayIconFilled({ className = "h-6 w-6" }) {
  return (
    <svg {...box} className={className} fill="currentColor">
      <path d="M2.8 18.2h18.4a9.2 9.2 0 0 0-18.4 0Z" />
      <circle cx="12" cy="5.8" r="2" />
      <path d="M5.2 4.6 6.8 6.2M18.8 4.6 17.2 6.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function RecipesIconFilled({ className = "h-6 w-6" }) {
  return (
    <svg {...box} className={className} fill="currentColor">
      <path d="M3.4 10.2h17.2v.4H3.4z" />
      <path d="M4.2 10.8h15.6v3.6a5 5 0 0 1-5 5H9.2a5 5 0 0 1-5-5v-3.6Z" />
      <path d="M9.4 3.4c1 1 .3 2.2-.2 3.2M13.8 3.4c1 1 .3 2.2-.2 3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M2.8 10.8h18.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function PlanIconFilled({ className = "h-6 w-6" }) {
  return (
    <svg {...box} className={className} fill="currentColor">
      <rect x="3.2" y="5" width="17.6" height="15.4" rx="4.2" />
      <path d="M9.4 3.2v3.4M14.6 3.2v3.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.4 13.6h11.2" stroke="hsl(var(--background))" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8.4" cy="17" r="1.4" fill="hsl(var(--background))" />
    </svg>
  );
}

export function ProfileIconFilled({ className = "h-6 w-6" }) {
  return (
    <svg {...box} className={className} fill="currentColor">
      <circle cx="12" cy="8" r="4.2" />
      <path d="M4.2 20.4c.6-4 3.9-6.4 7.8-6.4s7.2 2.4 7.8 6.4H4.2Z" />
    </svg>
  );
}