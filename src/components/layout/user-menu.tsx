"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogIn, LogOut, User, FolderOpen } from "lucide-react";
import Link from "next/link";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="size-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!session) {
    return (
      <Button variant="outline" size="sm" onClick={() => signIn("discord")} className="gap-2">
        <LogIn className="size-4" />
        Login mit Discord
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="size-8 cursor-pointer">
          <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? "User"} />
          <AvatarFallback>
            {session.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{session.user?.name}</p>
          <p className="text-xs text-muted-foreground">{session.user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 cursor-pointer" render={<Link href="/projects" />}>
          <FolderOpen className="size-4" />
          Meine Projekte
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer" render={<Link href="/marketplace" />}>
          <User className="size-4" />
          Marketplace
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="gap-2 cursor-pointer text-destructive">
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
