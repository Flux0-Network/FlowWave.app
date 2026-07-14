"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FolderOpen, Store, Menu, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserMenu } from "@/components/layout/user-menu";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/projects", label: "Dashboard", icon: FolderOpen },
  { href: "/marketplace", label: "Marketplace", icon: Store },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="flex h-13 items-center gap-6 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/logo.png" alt="FlowWave" width={120} height={40} className="h-8 w-auto object-contain" priority />
        </Link>

        {/* Divider */}
        <div className="hidden md:block w-px h-4 bg-border" />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "gap-1.5 text-[13px] h-8",
                  active
                    ? "bg-primary/12 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          <UserMenu />
        </div>

        {/* Mobile menu */}
        <div className="md:hidden ml-auto">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-10">
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "w-full justify-start gap-2 h-10",
                        active
                          ? "bg-primary/12 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-6 pt-6 border-t border-border">
                <UserMenu />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
