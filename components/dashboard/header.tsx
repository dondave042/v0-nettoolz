import { ReactNode } from "react"
import { ChevronRight } from "lucide-react"

interface DashboardHeaderProps {
  title: string
  description?: string
  breadcrumbs?: { label: string; href?: string }[]
  action?: ReactNode
}

export function DashboardHeader({
  title,
  description,
  breadcrumbs,
  action,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-foreground transition-colors">
                      {crumb.label}
                    </a>
                  ) : (
                    crumb.label
                  )}
                </span>
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        )}
        <h1 className="font-[var(--font-heading)] text-3xl font-bold text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
