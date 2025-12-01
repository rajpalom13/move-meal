"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  UtensilsCrossed,
  Car,
  User,
  LogOut,
  HelpCircle,
} from "lucide-react"

import { useAuthStore } from "@/context/auth-store"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/food-clusters', label: 'Food Clusters', icon: UtensilsCrossed },
  { href: '/dashboard/ride-clusters', label: 'Ride Clusters', icon: Car },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
]

const secondaryLinks = [
  { href: '/dashboard/help', label: 'Help & FAQ', icon: HelpCircle },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { isMobile } = useSidebar()

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <Image
                  src="/logo.png"
                  alt="MoveNmeal"
                  width={28}
                  height={28}
                  className="rounded-lg"
                />
                <span className="text-base font-semibold">MoveNmeal</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href ||
                  (link.href !== '/dashboard' && pathname.startsWith(link.href + '/'))

                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={link.label}
                      className={cn(
                        isActive && "bg-slate-blue/10 text-slate-blue"
                      )}
                    >
                      <Link href={link.href}>
                        <Icon className="h-5 w-5" />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href

                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={link.label}
                      className={cn(
                        isActive && "bg-slate-blue/10 text-slate-blue"
                      )}
                    >
                      <Link href={link.href}>
                        <Icon className="h-5 w-5" />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="rounded-lg bg-slate-blue-100 text-slate-blue-700 font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.college || 'Student'}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="rounded-lg bg-slate-blue-100 text-slate-blue-700">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user?.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
