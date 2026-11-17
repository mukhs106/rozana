import { cn } from "@/lib/utils";

const VARIANTS = {
  solid: "bg-chili text-chili-foreground hover:bg-chili/90 active:bg-chili",
  outline: "border border-border text-ink hover:border-ink-mid",
  quiet: "text-ink hover:bg-secondary",
  bare: "text-chili hover:text-ink",
};

const SIZES = {
  md: "h-12 px-6 text-[14px]",
  sm: "h-9 px-4 text-[12.5px]",
};

/** One primary action colour across the app: the solid pill is always chili. */
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
        "inline-flex select-none items-center justify-center gap-2 rounded-full font-medium leading-none transition-colors disabled:pointer-events-none disabled:opacity-40",
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