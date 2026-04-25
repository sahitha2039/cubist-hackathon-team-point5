import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border text-[11px] font-semibold uppercase tracking-[0.22em] transition-[transform,background-color,border-color,color,box-shadow] duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-cream-strong)] shadow-[0_12px_0_rgba(32,24,20,0.08)] hover:-translate-y-0.5 hover:border-[var(--brand-red)] hover:bg-[var(--brand-red)]",
        outline:
          "border-[rgba(32,24,20,0.16)] bg-transparent text-[var(--brand-ink)] hover:-translate-y-0.5 hover:bg-[rgba(255,248,237,0.76)] aria-expanded:bg-[rgba(255,248,237,0.76)]",
        secondary:
          "border-[rgba(32,24,20,0.12)] bg-[rgba(255,248,237,0.76)] text-[var(--brand-ink)] shadow-[0_10px_24px_rgba(32,24,20,0.05)] hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.94)] aria-expanded:bg-[rgba(255,255,255,0.94)]",
        ghost:
          "border-transparent bg-transparent text-[var(--brand-ink)] hover:bg-[rgba(255,248,237,0.76)] aria-expanded:bg-[rgba(255,248,237,0.76)]",
        destructive:
          "border-[rgba(199,84,68,0.24)] bg-[rgba(199,84,68,0.12)] text-[var(--brand-red)] hover:-translate-y-0.5 hover:bg-[rgba(199,84,68,0.18)] focus-visible:border-[rgba(199,84,68,0.4)] focus-visible:ring-[rgba(199,84,68,0.18)]",
        link: "rounded-none border-transparent p-0 text-[var(--brand-ink)] shadow-none underline-offset-4 hover:text-[var(--brand-red)] hover:underline",
      },
      size: {
        default:
          "h-11 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-8 rounded-full px-3 text-[10px] tracking-[0.18em] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-full px-4 text-[10px] tracking-[0.2em] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-14 px-7 text-[11px] tracking-[0.26em] has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6",
        icon: "size-11 p-0",
        "icon-xs":
          "size-8 rounded-full p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 rounded-full p-0",
        "icon-lg": "size-12 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
