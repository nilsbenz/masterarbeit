"use client";

import * as React from "react";

import Logo from "@/assets/logo.svg?react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar({
  lessons,
  currentPathname,
  ...props
}: {
  lessons: { title: string; slug: string }[];
  currentPathname: string;
} & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
                <Logo />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-heading text-lg font-semibold">
                  KI Dojo
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Lektionen</SidebarGroupLabel>
          <SidebarMenu>
            {lessons.map((item, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuButton
                  tooltip={item.title}
                  render={<a href={item.slug} />}
                  className="items-baseline"
                  isActive={
                    currentPathname.replace(/^\/+|\/+$/g, "") === item.slug
                  }
                >
                  <span className="text-xs text-sidebar-foreground/70 tabular-nums">
                    {index + 1}.
                  </span>
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <p className="text-xs font-medium text-muted-foreground">
              © {new Date().getFullYear()}. Alle Rechte vorbehalten.
            </p>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
