"use client";

import { AppSidebar } from "./app-sidebar";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";

export default function SidebarLayout({
  lessons,
  sidebarOpen,
  currentPathname,
  children,
}: {
  lessons: { title: string; slug: string }[];
  sidebarOpen: boolean;
  currentPathname: string;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar lessons={lessons} currentPathname={currentPathname} />
      <SidebarInset className="px-4 py-8">{children}</SidebarInset>
    </SidebarProvider>
  );
}
