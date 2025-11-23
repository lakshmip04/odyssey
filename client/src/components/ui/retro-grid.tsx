import { cn } from "@/lib/utils"

export function RetroGrid({
  className,
  angle = 65,
  gridSize = 50,
  ...props
}: {
  className?: string
  angle?: number
  gridSize?: number
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute size-full overflow-hidden opacity-50 [perspective:200px]",
        className
      )}
      style={
        {
          "--grid-size": `${gridSize}px`,
          "--angle": `${angle}deg`,
          "--color": "rgba(0,0,0,0.15)",
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        className="absolute inset-0 [transform:rotateX(var(--angle))] dark:[--color:rgba(255,255,255,0.1)] animate-retro-grid"
        style={{
          backgroundImage: `
            linear-gradient(var(--color) 1px, transparent 1px),
            linear-gradient(90deg, var(--color) 1px, transparent 1px)
          `,
          backgroundSize: "var(--grid-size) var(--grid-size)",
          backgroundPosition: "calc(var(--grid-size) / 2) calc(var(--grid-size) / 2)",
        }}
      />
    </div>
  )
}

