import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  className?: string
  variant?: 'default' | 'win' | 'lose' | 'draw'
}

export default function StatCard({ label, value, icon, className, variant = 'default' }: StatCardProps) {
  const variantClasses = {
    default: 'border-border',
    win: 'border-green-500/30',
    lose: 'border-destructive/30',
    draw: 'border-primary/30',
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-card/50 p-4 backdrop-blur-sm transition-all hover:bg-card/70',
        variantClasses[variant],
        className
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
    </div>
  )
}
