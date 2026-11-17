import { cn } from "@/lib/utils";

const VARIANTS = {
  solid: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary",
  soft: "bg-sand text-ink hover:bg-sand/70",
  outline: "border border-border text-ink hover:border-ink-mid",
  quiet: "text-ink hover:bg-secondary",
  bare: "text-chili hover:text-ink",
};

const SIZES = {
  md: "h-[52px] px-6 text-body",
  sm: "h-11 px-4 text-body",
};

/** Filled primary pill (oxblood), soft secondary pill (sand), outline, quiet and bare. */
export default function Pill({
  as: Comp = "button",
  variant = "solid",
  size = "md",
  className,
  children,
  ...props
}) {
  return (
    <Comp
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors disabled:pointer-events-none disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}