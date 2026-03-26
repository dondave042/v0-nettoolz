import React from "react"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  hoverable?: boolean
}

export function Card({
  children,
  header,
  footer,
  hoverable = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-card shadow-sm transition-all ${
        hoverable ? "hover:shadow-md hover:border-[#38bdf8]/50" : ""
      } ${className}`}
      {...props}
    >
      {header && (
        <div className="border-b border-border px-6 py-4 bg-gradient-to-r from-secondary/30 to-transparent">
          {header}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="border-t border-border bg-secondary/20 px-6 py-4">
          {footer}
        </div>
      )}
    </div>
  )
}
