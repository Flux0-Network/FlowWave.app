"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";

function DiscordIcon() {
  return (
    <svg viewBox="0 0 127.14 96.36" className="size-4 fill-current shrink-0">
      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.12 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.12 12.69-11.43 12.69Z" />
    </svg>
  );
}

function LoginButton() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/projects";

  return (
    <Button
      className="w-full gap-3 h-11 text-[14px] font-semibold bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3c45a5] text-white border-0 shadow-lg transition-colors"
      onClick={() => signIn("discord", { callbackUrl })}
    >
      <DiscordIcon />
      Mit Discord anmelden
    </Button>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Subtle background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="FlowWave"
            width={180}
            height={60}
            className="h-11 w-auto"
            priority
          />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 space-y-6 shadow-2xl">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <h1 className="text-[18px] font-semibold tracking-tight">
              Willkommen bei FlowWave
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Melde dich mit Discord an um fortzufahren
            </p>
          </div>

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground/60 shrink-0">
              Sicher & kostenlos
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Login button */}
          <Suspense
            fallback={
              <Button
                className="w-full gap-3 h-11 bg-[#5865F2] text-white border-0"
                disabled
              >
                <DiscordIcon />
                Mit Discord anmelden
              </Button>
            }
          >
            <LoginButton />
          </Suspense>

          {/* Feature hints */}
          <div className="space-y-2 pt-1">
            {[
              "Discord-Bot Projekte verwalten",
              "Code-Editor mit KI-Assistent",
              "Live-Deploy & Logs",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="size-1.5 rounded-full bg-[#5865F2]/60 shrink-0" />
                <span className="text-[12px] text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/50">
          Wir speichern keine Passwörter. Nur dein Discord-Profil wird verwendet.
        </p>
      </div>
    </div>
  );
}
