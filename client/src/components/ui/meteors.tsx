import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface MeteorsProps {
  number?: number
  className?: string
}

export const Meteors = ({ number = 20, className }: MeteorsProps) => {
  const [meteors, setMeteors] = useState<Array<{ 
    id: number
    left: string
    animationDelay: string
    animationDuration: string
    top: string
  }>>([])

  useEffect(() => {
    const meteorArray = Array.from({ length: number }, (_, i) => {
      const left = Math.floor(Math.random() * (100 - -10) + -10) + "%"
      const top = Math.floor(Math.random() * (100 - -10) + -10) + "%"
      const animationDelay = Math.random() * (0.8 - 0.2) + 0.2 + "s"
      const animationDuration = Math.floor(Math.random() * (10 - 2) + 2) + "s"
      
      return {
        id: i,
        left,
        top,
        animationDelay,
        animationDuration,
      }
    })
    setMeteors(meteorArray)
  }, [number])

  return (
    <>
      {meteors.map((meteor) => (
        <span
          key={meteor.id}
          className={cn(
            "animate-meteor-effect absolute h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent",
            className
          )}
          style={{
            top: meteor.top,
            left: meteor.left,
            animationDelay: meteor.animationDelay,
            animationDuration: meteor.animationDuration,
          }}
        />
      ))}
    </>
  )
}

