"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/food-clusters': 'Food Clusters',
  '/dashboard/ride-clusters': 'Ride Clusters',
  '/dashboard/profile': 'Profile',
  '/dashboard/settings': 'Settings',
  '/dashboard/help': 'Help',
}

export function SiteHeader() {
  const pathname = usePathname()

  // Get page title from pathname
  const getPageTitle = () => {
    // Check for exact match first
    if (pageTitles[pathname]) {
      return pageTitles[pathname]
    }

    // Check for partial matches (e.g., /dashboard/food-clusters/123)
    for (const [path, title] of Object.entries(pageTitles)) {
      if (pathname.startsWith(path + '/')) {
        // For detail pages, show the parent title
        return title
      }
    }

    return 'MoveNmeal'
  }

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{getPageTitle()}</h1>
      </div>
    </header>
  )
}
