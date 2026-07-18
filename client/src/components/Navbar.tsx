"use client";

import { Avatar, Button, toast } from "@heroui/react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { BrandLogo } from "./BrandLogo";

const LOGGED_OUT_LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const LOGGED_IN_LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/courses", label: "My Courses" },
  { href: "/dashboard/study-plan", label: "Study Plan" },
  { href: "/dashboard/chat", label: "Chat" },
  { href: "/items/add", label: "Add Course" },
  { href: "/items/manage", label: "Manage Courses" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isLoggedIn = !isPending && Boolean(session?.user);
  const links = isLoggedIn ? LOGGED_IN_LINKS : LOGGED_OUT_LINKS;

  async function handleLogout() {
    await authClient.signOut();
    setIsMobileOpen(false);
    toast.success("Logged out");
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center" aria-label="SkillPath AI — Home">
          {/* Icon-only mark below sm: the horizontal wordmark is too wide for
              the compact mobile header alongside the hamburger button. */}
          <BrandLogo variant="icon" background="light" priority className="h-8 w-8 sm:hidden" />
          <BrandLogo
            variant="horizontal"
            background="light"
            priority
            className="hidden h-8 w-auto sm:block"
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-indigo-600"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isPending ? null : isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                {/* Radix's Avatar.Image unmounts itself on load error, so
                    Avatar.Fallback shows through automatically — covers
                    both a missing image and a broken/dead URL. */}
                {session!.user.image && (
                  <Avatar.Image src={session!.user.image} alt={session!.user.name ?? "Profile"} />
                )}
                <Avatar.Fallback>
                  {(session!.user.name || session!.user.email || "U")[0]!.toUpperCase()}
                </Avatar.Fallback>
              </Avatar>
              <Button variant="outline" size="sm" onPress={handleLogout}>
                Log out
              </Button>
            </div>
          ) : (
            <>
              {/* Plain styled Links, not <Link><Button/></Link> — nesting a
                  React Aria pressable Button inside next/link's Link
                  renders a <button> inside an <a> and triggers React
                  Aria's "PressResponder rendered without a pressable
                  child" warning, since Button can't attach its press
                  handling to a DOM node Link already owns. */}
              <Link
                href="/login"
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
          className="text-zinc-700 md:hidden"
          onClick={() => setIsMobileOpen((open) => !open)}
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileOpen && (
        <div className="border-t border-zinc-200 bg-white md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === link.href
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-zinc-200 pt-3">
              {isPending ? null : isLoggedIn ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-1">
                    <Avatar size="sm">
                      {session!.user.image && (
                        <Avatar.Image
                          src={session!.user.image}
                          alt={session!.user.name ?? "Profile"}
                        />
                      )}
                      <Avatar.Fallback>
                        {(session!.user.name || session!.user.email || "U")[0]!.toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium text-zinc-700">
                      {session!.user.name || session!.user.email}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onPress={handleLogout}>
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileOpen(false)}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMobileOpen(false)}
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-center text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
