import Logo from "@/assets/logo.svg?react";
import { cn } from "cn";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";

export default function BottomNav({
  lesson,
  lessons,
}: {
  lesson?: { title: string; slug: string };
  lessons: { title: string; slug: string }[];
}) {
  if (!lesson) {
    return null;
  }

  return (
    <aside className="h-17 md:hidden">
      <Drawer>
        <DrawerTrigger className="fixed right-5 bottom-5 left-5 z-40 mx-auto flex h-12 max-w-md items-center gap-1.5 rounded-full bg-accent/70 px-4 shadow-md ring-1 ring-foreground/5 backdrop-blur-md">
          <Logo className="size-6 shrink-0 text-primary" />
          <span className="truncate text-muted-foreground">
            <span className="font-heading text-lg font-semibold text-accent-foreground">
              KI Dojo
            </span>
            &nbsp;/ {lesson.title}
          </span>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>KI Dojo</DrawerTitle>
            <DrawerDescription>Navigation</DrawerDescription>
          </DrawerHeader>
          <div className="mx-auto mt-3 h-1.5 w-20 shrink-0 rounded-full bg-foreground/15" />
          <div className="scroll-fade overflow-y-auto p-4">
            {lessons.map((item, index) => (
              <a
                key={index}
                href={`/${item.slug}`}
                className={cn(
                  "flex h-10 items-center rounded-full px-4 text-base font-medium",
                  item.slug === lesson.slug &&
                    "bg-accent text-accent-foreground"
                )}
              >
                <span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {index + 1}.
                  </span>
                  &nbsp;{item.title}
                </span>
              </a>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </aside>
  );
}
