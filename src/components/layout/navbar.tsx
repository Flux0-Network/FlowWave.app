"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cog, Blocks, FolderOpen, Menu, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/builder", label: "Components V2 Builder", icon: Blocks },
  { href: "/generator", label: "Cog Generator", icon: Cog },
  { href: "/projects", label: "Projects", icon: FolderOpen },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg mr-8">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <Cog className="size-5 text-primary-foreground" />
          </div>
          <span>CogsForge</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({
                  variant: pathname.startsWith(item.href) ? "secondary" : "ghost",
                  size: "sm",
                }),
                "gap-2",
                pathname.startsWith(item.href) && "font-medium"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2 ml-auto">
          <Link
            href="https://github.com"
            target="_blank"
            rel="noopener"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            GitHub
          </Link>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="md:hidden ml-auto"
            render={<Button variant="ghost" size="icon" />}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col gap-2 mt-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({
                      variant: pathname.startsWith(item.href) ? "secondary" : "ghost",
                    }),
                    "w-full justify-start gap-2"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
