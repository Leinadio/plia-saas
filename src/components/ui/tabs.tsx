"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-4 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

// Une rangée posée sur un filet, et celui qui porte prend le trait sarcelle sous
// le pied. C'est le repère de destination du produit, à la même échelle que dans
// la barre du haut.
const tabsListVariants = cva(
  "group/tabs-list border-filet text-ardoise inline-flex w-fit items-center justify-center gap-1 border-b group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:border-b-0",
  {
    variants: {
      variant: { default: "", line: "" },
    },
    defaultVariants: { variant: "default" },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-9 items-center justify-center gap-1.5 rounded-t-md px-3 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors duration-150",
        "hover:text-foreground hover:bg-survol disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:text-sarcelle-encre",
        "after:bg-sarcelle after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:rounded-full after:opacity-0 after:transition-opacity data-[state=active]:after:opacity-100",
        "group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
