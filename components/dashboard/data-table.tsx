"use client"

import React from "react"
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
} from "lucide-react"

interface Column<T> {
  header: string
  accessor: keyof T
  cell?: (value: T[keyof T], row: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  searchPlaceholder?: string
  title?: string
  emptyMessage?: string
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  searchPlaceholder = "Search...",
  title,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")
  const [searchTerm, setSearchTerm] = React.useState("")

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    : filteredData

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {title && (
        <div className="border-b border-border px-6 py-4 bg-gradient-to-r from-secondary/30 to-transparent">
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
      )}

      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        {sortedData.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/20 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {columns.map((column) => (
                  <th
                    key={String(column.accessor)}
                    className={`px-6 py-3 cursor-pointer hover:bg-secondary/40 transition-colors ${
                      column.width || ""
                    }`}
                    onClick={() =>
                      column.sortable !== false && handleSort(column.accessor)
                    }
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable !== false && (
                        <>
                          {sortColumn === column.accessor ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-4 w-4 opacity-40" />
                          )}
                        </>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`border-b border-border last:border-0 transition-colors ${
                    onRowClick
                      ? "hover:bg-secondary/20 cursor-pointer"
                      : "hover:bg-secondary/10"
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.accessor)}
                      className="px-6 py-4 text-sm text-foreground"
                    >
                      {column.cell
                        ? column.cell(row[column.accessor], row, rowIndex)
                        : String(row[column.accessor])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
