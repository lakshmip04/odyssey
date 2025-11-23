import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MagicCardProps {
  children: ReactNode
  className?: string
  gradientColor?: string
}

export const MagicCard = ({ children, className, gradientColor = "#262626" }: MagicCardProps) => {
  return (
    <div
      className={cn(
        "group relative flex h-full w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900",
        className
      )}
      style={
        {
          "--gradient-color": gradientColor,
        } as React.CSSProperties
      }
    >
      <div className="relative z-10">{children}</div>
      <div className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(0deg, transparent 0%, var(--gradient-color) 100%)`,
            filter: "blur(20px)",
          }}
        />
      </div>
    </div>
  )
}

