"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azul/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-azul text-white shadow hover:bg-azul-dark",
        destructive: "bg-red-950 text-white shadow-sm hover:bg-red-900",
        cool: "border border-white/25 bg-gradient-to-t from-azul to-azul-dark text-white shadow-lg shadow-azul/25 hover:brightness-110 active:brightness-90",
        outline: "border border-white/25 bg-transparent text-white hover:bg-white/10",
        secondary: "bg-graphite2 text-white hover:bg-graphite2/80",
        ghost: "text-white hover:bg-white/10",
        link: "text-azul underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

const liquidButtonVariants = cva(
  "relative isolate inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full text-sm font-semibold text-white transition-[color,box-shadow,transform] duration-300 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-azul/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-white/35 bg-[#090909] text-white shadow-[0_4px_14px_rgba(0,0,0,0.7)] hover:scale-[1.03] hover:bg-[#111111]",
        destructive: "border border-red-200/25 bg-red-950/75 text-white hover:bg-red-900",
        outline: "border border-white/35 bg-white/5 text-white hover:bg-white/10",
        secondary: "border border-white/15 bg-graphite2/70 text-white hover:bg-graphite2",
        ghost: "border border-transparent bg-transparent text-white hover:bg-white/10",
        link: "border-0 bg-transparent text-azul underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 gap-1.5 px-4 text-xs",
        lg: "h-10 rounded-full px-6",
        xl: "h-12 rounded-full px-8",
        xxl: "h-14 rounded-full px-10",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "xxl",
    },
  },
)

export type LiquidButtonProps = React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof liquidButtonVariants> & {
    asChild?: boolean
  }

function LiquidContent({
  children,
  filterId,
}: {
  children: React.ReactNode
  filterId: string
}) {
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] shadow-[inset_0_1px_1px_rgba(255,255,255,0.42),inset_0_-1px_1px_rgba(255,255,255,0.14),0_2px_8px_rgba(0,0,0,0.55)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.05)_16%,rgba(255,255,255,0)_43%,rgba(0,0,0,0.28)_76%,rgba(255,255,255,0.12)_100%)]"
        style={{ backdropFilter: `url("#${filterId}")` }}
      />
      <span className="pointer-events-none relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
      <GlassFilter id={filterId} />
    </>
  )
}

export function LiquidButton({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: LiquidButtonProps) {
  const filterId = `container-glass-${React.useId().replace(/:/g, "")}`
  const buttonClassName = cn(liquidButtonVariants({ variant, size, className }))

  if (asChild) {
    const child = React.Children.only(children)
    if (!React.isValidElement<{ children?: React.ReactNode }>(child)) {
      throw new Error("LiquidButton with asChild expects one React element.")
    }

    return (
      <Slot
        {...props}
        data-slot="liquid-glass-button"
        className={buttonClassName}
      >
        {React.cloneElement(
          child,
          {},
          <LiquidContent filterId={filterId}>{child.props.children}</LiquidContent>,
        )}
      </Slot>
    )
  }

  return (
    <button
      data-slot="liquid-glass-button"
      className={buttonClassName}
      {...props}
    >
      <LiquidContent filterId={filterId}>{children}</LiquidContent>
    </button>
  )
}

function GlassFilter({ id }: { id: string }) {
  return (
    <svg aria-hidden="true" className="hidden">
      <defs>
        <filter
          id={id}
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.05"
            numOctaves="1"
            seed="1"
            result="turbulence"
          />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="70"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}

type ColorVariant = "default" | "primary" | "success" | "error" | "gold" | "bronze"

interface MetalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ColorVariant
}

const colorVariants: Record<
  ColorVariant,
  {
    outer: string
    inner: string
    button: string
    textColor: string
    textShadow: string
  }
> = {
  default: {
    outer: "bg-gradient-to-b from-graphite to-silver",
    inner: "bg-gradient-to-b from-[#FAFAFA] via-[#3E3E3E] to-[#E5E5E5]",
    button: "bg-gradient-to-b from-silver to-[#505050]",
    textColor: "text-white",
    textShadow: "[text-shadow:_0_-1px_0_rgb(30_30_30_/_100%)]",
  },
  primary: {
    outer: "bg-gradient-to-b from-azul-dark to-azul",
    inner: "bg-gradient-to-b from-[#f2d9db] via-azul-dark to-[#7f1d1d]",
    button: "bg-gradient-to-b from-azul to-azul-dark",
    textColor: "text-white",
    textShadow: "[text-shadow:_0_-1px_0_rgb(80_8_14_/_100%)]",
  },
  success: {
    outer: "bg-gradient-to-b from-[#005A43] to-[#7CCB9B]",
    inner: "bg-gradient-to-b from-[#E5F8F0] via-[#00352F] to-[#D1F0E6]",
    button: "bg-gradient-to-b from-[#9ADBC8] to-[#3E8F7C]",
    textColor: "text-[#FFF7F0]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(6_78_59_/_100%)]",
  },
  error: {
    outer: "bg-gradient-to-b from-[#5A0000] to-[#FFAEB0]",
    inner: "bg-gradient-to-b from-[#FFDEDE] via-[#680002] to-[#FFE9E9]",
    button: "bg-gradient-to-b from-[#F08D8F] to-[#A45253]",
    textColor: "text-[#FFF7F0]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(146_64_14_/_100%)]",
  },
  gold: {
    outer: "bg-gradient-to-b from-[#917100] to-[#EAD98F]",
    inner: "bg-gradient-to-b from-[#FFFDDD] via-[#856807] to-[#FFF1B3]",
    button: "bg-gradient-to-b from-[#FFEBA1] to-[#9B873F]",
    textColor: "text-[#FFFDE5]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(178_140_2_/_100%)]",
  },
  bronze: {
    outer: "bg-gradient-to-b from-[#864813] to-[#E9B486]",
    inner: "bg-gradient-to-b from-[#EDC5A1] via-[#5F2D01] to-[#FFDEC1]",
    button: "bg-gradient-to-b from-[#FFE3C9] to-[#A36F3D]",
    textColor: "text-[#FFF7F0]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(124_45_18_/_100%)]",
  },
}

const metalButtonVariants = (
  variant: ColorVariant = "default",
  isPressed: boolean,
  isHovered: boolean,
  isTouchDevice: boolean,
) => {
  const colors = colorVariants[variant]
  const transition = "all 250ms cubic-bezier(0.1, 0.4, 0.2, 1)"

  return {
    wrapper: cn(
      "relative inline-flex transform-gpu rounded-md p-[1.25px] will-change-transform",
      colors.outer,
    ),
    wrapperStyle: {
      transform: isPressed ? "translateY(2.5px) scale(0.99)" : "translateY(0) scale(1)",
      boxShadow: isPressed
        ? "0 1px 2px rgba(0, 0, 0, 0.15)"
        : isHovered && !isTouchDevice
          ? "0 4px 12px rgba(0, 0, 0, 0.12)"
          : "0 3px 8px rgba(0, 0, 0, 0.08)",
      transition,
      transformOrigin: "center center",
    } satisfies React.CSSProperties,
    inner: cn(
      "absolute inset-[1px] transform-gpu rounded-lg will-change-transform",
      colors.inner,
    ),
    innerStyle: {
      transition,
      transformOrigin: "center center",
      filter: isHovered && !isPressed && !isTouchDevice ? "brightness(1.05)" : "none",
    } satisfies React.CSSProperties,
    button: cn(
      "relative z-10 m-px inline-flex h-11 transform-gpu cursor-pointer items-center justify-center overflow-hidden rounded-md px-6 py-2 text-sm font-semibold leading-none outline-none will-change-transform",
      colors.button,
      colors.textColor,
      colors.textShadow,
    ),
    buttonStyle: {
      transform: isPressed ? "scale(0.97)" : "scale(1)",
      transition,
      transformOrigin: "center center",
      filter: isHovered && !isPressed && !isTouchDevice ? "brightness(1.02)" : "none",
    } satisfies React.CSSProperties,
  }
}

function ShineEffect({ isPressed }: { isPressed: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-20 overflow-hidden transition-opacity duration-300",
        isPressed ? "opacity-20" : "opacity-0",
      )}
    >
      <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-neutral-100 to-transparent" />
    </div>
  )
}

export const MetalButton = React.forwardRef<HTMLButtonElement, MetalButtonProps>(
  (
    {
      children,
      className,
      variant = "default",
      onMouseDown,
      onMouseUp,
      onMouseLeave,
      onMouseEnter,
      onTouchStart,
      onTouchEnd,
      onTouchCancel,
      ...props
    },
    ref,
  ) => {
    const [isPressed, setIsPressed] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const [isTouchDevice, setIsTouchDevice] = React.useState(false)

    React.useEffect(() => {
      setIsTouchDevice(
        typeof window !== "undefined" &&
          ("ontouchstart" in window || navigator.maxTouchPoints > 0),
      )
    }, [])

    const variants = metalButtonVariants(variant, isPressed, isHovered, isTouchDevice)
    const buttonText = children ?? "Button"

    return (
      <div className={variants.wrapper} style={variants.wrapperStyle}>
        <div aria-hidden="true" className={variants.inner} style={variants.innerStyle} />
        <button
          ref={ref}
          className={cn(variants.button, className)}
          style={variants.buttonStyle}
          {...props}
          onMouseDown={(event) => {
            setIsPressed(true)
            onMouseDown?.(event)
          }}
          onMouseUp={(event) => {
            setIsPressed(false)
            onMouseUp?.(event)
          }}
          onMouseLeave={(event) => {
            setIsPressed(false)
            setIsHovered(false)
            onMouseLeave?.(event)
          }}
          onMouseEnter={(event) => {
            if (!isTouchDevice) setIsHovered(true)
            onMouseEnter?.(event)
          }}
          onTouchStart={(event) => {
            setIsPressed(true)
            onTouchStart?.(event)
          }}
          onTouchEnd={(event) => {
            setIsPressed(false)
            onTouchEnd?.(event)
          }}
          onTouchCancel={(event) => {
            setIsPressed(false)
            onTouchCancel?.(event)
          }}
        >
          <ShineEffect isPressed={isPressed} />
          {buttonText}
          {isHovered && !isPressed && !isTouchDevice && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-transparent to-white/5"
            />
          )}
        </button>
      </div>
    )
  },
)
MetalButton.displayName = "MetalButton"

export { Button, buttonVariants, liquidButtonVariants }
