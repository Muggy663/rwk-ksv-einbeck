"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useMobileDetection } from "@/hooks/use-mobile-detection"

const MobileTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => {
  const { isMobile } = useMobileDetection()
  
  return (
    <div className={cn("relative w-full", isMobile && "overflow-visible")}>
      <table
        ref={ref}
        className={cn(
          "w-full caption-bottom text-sm",
          isMobile ? "block" : "table",
          className
        )}
        {...props}
      />
    </div>
  )
})
MobileTable.displayName = "MobileTable"

const MobileTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const { isMobile } = useMobileDetection()
  
  return (
    <thead
      ref={ref}
      className={cn(
        isMobile ? "hidden" : "[&_tr]:border-b",
        className
      )}
      {...props}
    />
  )
})
MobileTableHeader.displayName = "MobileTableHeader"

const MobileTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const { isMobile } = useMobileDetection()
  
  return (
    <tbody
      ref={ref}
      className={cn(
        isMobile ? "block space-y-3" : "[&_tr:last-child]:border-0",
        className
      )}
      {...props}
    />
  )
})
MobileTableBody.displayName = "MobileTableBody"

const MobileTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => {
  const { isMobile } = useMobileDetection()
  
  return (
    <tr
      ref={ref}
      className={cn(
        isMobile 
          ? "block bg-card border rounded-lg p-4 shadow-sm" 
          : "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
})
MobileTableRow.displayName = "MobileTableRow"

const MobileTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
MobileTableHead.displayName = "MobileTableHead"

interface MobileTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  label?: string
  hideOnMobile?: boolean
}

const MobileTableCell = React.forwardRef<
  HTMLTableCellElement,
  MobileTableCellProps
>(({ className, label, hideOnMobile, children, ...props }, ref) => {
  const { isMobile } = useMobileDetection()
  
  if (isMobile && hideOnMobile) {
    return null
  }
  
  return (
    <td
      ref={ref}
      className={cn(
        isMobile 
          ? "block py-1 [&:has([role=checkbox])]:pr-0" 
          : "p-4 align-middle [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    >
      {isMobile && label ? (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">{label}:</span>
          <span className="text-sm">{children}</span>
        </div>
      ) : (
        children
      )}
    </td>
  )
})
MobileTableCell.displayName = "MobileTableCell"

const MobileTableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
MobileTableCaption.displayName = "MobileTableCaption"

export {
  MobileTable,
  MobileTableHeader,
  MobileTableBody,
  MobileTableCaption,
  MobileTableRow,
  MobileTableHead,
  MobileTableCell,
}