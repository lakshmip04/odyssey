import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface StepperProps {
  steps: string[]
  currentStep: number
  className?: string
}

export const Stepper = ({ steps, currentStep, className }: StepperProps) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isUpcoming = index > currentStep

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                    isCompleted &&
                      "bg-primary border-primary text-primary-foreground",
                    isCurrent &&
                      "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
                    isUpcoming && "bg-background border-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center max-w-[60px]",
                    isCurrent && "text-primary font-semibold",
                    isCompleted && "text-primary",
                    isUpcoming && "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-all",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

