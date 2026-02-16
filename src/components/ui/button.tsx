import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'destructive'
    size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        const variants = {
            default: "text-primary-foreground border border-cyan-300/40 bg-[linear-gradient(125deg,#22d3ee_0%,#14b8a6_55%,#0ea5e9_100%)] shadow-[0_16px_30px_-12px_rgba(14,165,233,0.65)] hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-12px_rgba(14,165,233,0.75)]",
            destructive: "bg-destructive text-destructive-foreground shadow-[0_12px_26px_-10px_rgba(239,68,68,0.7)] hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-12px_rgba(239,68,68,0.8)]",
            outline: "border border-border bg-card/70 text-foreground hover:border-primary/50 hover:bg-primary/10",
            ghost: "text-foreground/90 hover:bg-primary/10 hover:text-foreground",
        }
        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10",
        }

        return (
            <button
                className={cn(
                    "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium tracking-[0.0125em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    variants[variant],
                    sizes[size],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
