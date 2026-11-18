import * as React from "react"

import { cn } from "@/lib/utils"

type AnimatedGradientProps = React.ComponentPropsWithoutRef<"section">

export const AnimatedGradient = React.forwardRef<
  HTMLElement,
  AnimatedGradientProps
>(({ children, className, ...props }, ref) => (
  <section
    ref={ref}
    className={cn(
      "relative isolate h-screen w-full overflow-hidden bg-slate-950",
      className,
    )}
    {...props}
  >
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animated-gradient-orb animated-gradient-orb--one bg-carmim" />
      <div className="animated-gradient-orb animated-gradient-orb--two bg-champagne" />
      <div className="animated-gradient-orb animated-gradient-orb--three bg-carmim-dark" />
      <div className="animated-gradient-orb animated-gradient-orb--four bg-rose-500" />
    </div>

    <div className="relative z-10 flex h-full w-full items-center justify-center">
      {children}
    </div>
  </section>
))

AnimatedGradient.displayName = "AnimatedGradient"

export default AnimatedGradient
