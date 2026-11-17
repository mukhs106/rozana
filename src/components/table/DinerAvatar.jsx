import { cn } from "@/lib/utils";

// Muted, distinct backgrounds so four people at a table read apart at a glance.
const TINTS = ["bg-[#F3E3D3]", "bg-[#DDE8E1]", "bg-[#E6E0EE]", "bg-[#F5E6C8]", "bg-[#DCE5EE]", "bg-[#EEDCDC]"];

function tintFor(id = "") {
  let hash = 0;
  for (const char of String(id)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TINTS[hash % TINTS.length];
}

export default function DinerAvatar({ member, size = 48, className }) {
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-ink", tintFor(member?.id), className)}
      style={{ width: size, height: size, fontSize: size >= 44 ? 18 : 14 }}
      aria-hidden="true"
    >
      {String(member?.name || "?").charAt(0).toUpperCase()}
    </span>
  );
}
