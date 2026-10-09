"use client";

import { AppSidebar } from "./app-sidebar";
import BottomNav from "./bottom-nav";
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
      <SidebarInset className="px-4 py-8">
        {children}
        <BottomNav
          lesson={lessons.find(
            (lesson) =>
              lesson.slug === currentPathname.replace(/^\/+|\/+$/g, "")
          )}
          lessons={lessons}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
