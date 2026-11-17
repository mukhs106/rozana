// Allergen and heat marks, drawn from the chilli in the editorial reference:
// one crisp filled silhouette with a short hand-drawn stem, no fine detail, so
// each reads at 20px beside its label. Never use these as a "safe" marker:
// an outlined mark means the ingredient is in the dish, not that it is absent.

const box = {
  viewBox: "0 0 24 24",
  "aria-hidden": "true",
  focusable: "false",
  className: "h-5 w-5",
};

export function ChilliIcon({ className }) {
  return (
    <svg {...box} className={className}>
      <path
        d="M16.1 3.6c.9-.5 1.9-1.1 2.4-.5.5.6-.2 1.6-1 2.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14.6 5.2c1.7 1.5 2.3 3.8 1.4 6.3-1.2 3.4-4.7 6.5-8.1 7.2-1.5.3-2.6-.5-2.3-1.8.3-1.4 1.7-2.7 3-3.6 1.8-1.2 4-2.4 4.1-4.7.1-1.3-.5-2.5-.2-3.2.3-.8 1.3-.9 2.1-.2Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DairyIcon({ className }) {
  return (
    <svg {...box} className={className}>
      <path
        d="M9.2 3.4h5.6l-.7 2.5c1.3.8 2.1 2.2 2.1 3.7v8.4c0 1.2-1 2.2-2.2 2.2H10c-1.2 0-2.2-1-2.2-2.2v-8.4c0-1.5.8-2.9 2.1-3.7l-.7-2.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M10.6 12.4c.8-.9 1.6-.4 1.6.5 0 .8-.9 1.5-1.6 2.1-.7-.6-1.6-1.3-1.6-2.1 0-.9.8-1.4 1.6-.5Z" fill="white" />
    </svg>
  );
}

export function SoyIcon({ className }) {
  return (
    <svg {...box} className={className}>
      <path
        d="M4.6 18.4c-1.2-1.4.3-4.4 3.2-6.7 2.9-2.4 6.4-3.8 8.1-2.9 1.6.9 1.6 3.4.1 5.7-1.6 2.3-4.6 4.2-6.9 4.6-2.2.4-3.6-.1-4.5-.7Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <circle cx="9.4" cy="14.6" r="1.25" fill="white" />
      <circle cx="12.6" cy="13.1" r="1.25" fill="white" />
      <circle cx="11.8" cy="16.7" r="1.25" fill="white" />
      <path d="M9.8 8.4c.5-1.6 1.8-2.7 3.4-3.1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function PeanutIcon({ className }) {
  return (
    <svg {...box} className={className}>
      <path
        d="M9.7 4.3c2-1.3 4.5-.7 5.2 1 .5 1.2-.2 2.2-.6 3.3-.4 1.2-.4 2.4.7 3.4 1.4 1.3 2.9 1.5 4 2.2 1.6 1 1.8 3.2.2 4.5-1.9 1.6-4.9 1-5.9-.6-.7-1.1-.3-2.3.1-3.5.4-1.1.3-2.2-.8-3.1-1.5-1.4-3-1.5-4-2.3-1.5-1.1-1.5-3.1.1-4.4Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M10.6 8.2c.5.4.9.9 1 1.5M14.4 15.4c.5.4.8 1 .8 1.6" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function TreeNutIcon({ className }) {
  return (
    <svg {...box} className={className}>
      <path
        d="M12 3.6c2.4 0 4.4 1.6 4.9 3.9.5 2.4-.6 4-1.6 5.4-.9 1.3-1.4 2.7-1.2 4.4.2 1.6-.8 3.1-2.1 3.1-1.3 0-2.3-1.5-2.1-3.1.2-1.7-.3-3.1-1.2-4.4-1-1.4-2.1-3-1.6-5.4C7.6 5.2 9.6 3.6 12 3.6Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M12 5.4v13" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function WheatIcon({ className }) {
  return (
    <svg {...box} className={className}>
      <path d="M12 20.6V8.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M12 8.2c-2.6 0-3.9-1.9-3.6-4.1 2.2-.2 4 1.2 3.6 4.1ZM12 8.2c2.6 0 3.9-1.9 3.6-4.1-2.2-.2-4 1.2-3.6 4.1Z"
        fill="currentColor"
      />
      <path
        d="M11.4 12c-2.4-.3-3.5-2.2-3-4.3 2.2.1 3.7 1.7 3 4.3ZM12.6 12c2.4-.3 3.5-2.2 3-4.3-2.2.1-3.7 1.7-3 4.3Z"
        fill="currentColor"
      />
      <path
        d="M11.2 16c-2.3-.4-3.3-2.3-2.8-4.3 2.1.2 3.5 1.8 2.8 4.3ZM12.8 16c2.3-.4 3.3-2.3 2.8-4.3-2.1.2-3.5 1.8-2.8 4.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function OnionGarlicIcon({ className }) {
  return (
    <svg {...box} className={className}>
      <path
        d="M12 20.6c-4.1 0-7-2.9-7-6.2 0-2.9 1.9-4.6 3.6-6 .9-.7 1.6-1.6 1.9-2.7l.4-1.4c.2-.7 1.3-.7 1.5 0l.4 1.4c.3 1.1 1 2 1.9 2.7 1.7 1.4 3.6 3.1 3.6 6 0 3.3-2.9 6.2-6.3 6.2Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M12 9.4v10.4M9.2 11.4c-.7 2.2-.5 5 .5 7.6M14.8 11.4c.7 2.2.5 5-.5 7.6" fill="none" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function SesameIcon({ className }) {
  return (
    <svg {...box} className={className}>
      <ellipse cx="8.6" cy="9" rx="2" ry="3" transform="rotate(-24 8.6 9)" fill="currentColor" />
      <ellipse cx="15.4" cy="10.4" rx="2" ry="3" transform="rotate(18 15.4 10.4)" fill="currentColor" />
      <ellipse cx="11.8" cy="16" rx="2" ry="3" transform="rotate(-6 11.8 16)" fill="currentColor" />
    </svg>
  );
}

export function EggIcon({ className }) {
  return (
    <svg {...box} className={className}>
      <path
        d="M12 3.8c3 0 6.2 5.1 6.2 9.1 0 3.8-2.8 6.6-6.2 6.6s-6.2-2.8-6.2-6.6c0-4 3.2-9.1 6.2-9.1Z"
        fill="currentColor"
      />
      <circle cx="10.6" cy="12.6" r="1.6" fill="white" />
    </svg>
  );
}

export function FishIcon({ className }) {
  return (
    <svg {...box} className={className}>
      <path
        d="M3.8 12c2.6-3.6 6-5.1 9.4-4.4 2.6.6 4.6 2.4 5.8 4.4-1.2 2-3.2 3.8-5.8 4.4-3.4.7-6.8-.8-9.4-4.4Z"
        fill="currentColor"
      />
      <circle cx="8.6" cy="11" r="1" fill="white" />
      <path d="M18.8 9.6 21 7.8v8.4l-2.2-1.8" fill="currentColor" />
    </svg>
  );
}

export const ALLERGEN_ICONS = {
  dairy: DairyIcon,
  soy: SoyIcon,
  peanuts: PeanutIcon,
  nuts: TreeNutIcon,
  gluten: WheatIcon,
  oniongarlic: OnionGarlicIcon,
  sesame: SesameIcon,
  egg: EggIcon,
  fish: FishIcon,
  shellfish: FishIcon,
  spice: ChilliIcon,
};