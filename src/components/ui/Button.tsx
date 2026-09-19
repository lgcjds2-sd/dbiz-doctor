import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-navy-800 text-white hover:bg-navy-700 disabled:bg-slate-300',
  secondary: 'bg-white text-navy-800 border border-slate-300 hover:bg-slate-50',
  ghost: 'text-navy-700 hover:bg-slate-100',
  danger: 'bg-severity-critical text-white hover:opacity-90',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}
