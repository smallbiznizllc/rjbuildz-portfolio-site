"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderOpen,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Settings,
  Share2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/posts", label: "Posts", icon: Newspaper },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/social", label: "Socials", icon: Share2 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ open = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/admin/login");
    router.refresh();
  }

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#b87333]">
            Admin
          </p>
          <p className="mt-0.5 font-[family-name:var(--font-dm-sans)] text-lg font-semibold text-zinc-900">
            RJ Buildz
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => {
          const exact = "exact" in item && item.exact;
          const active = exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white lg:block">
        {content}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          type="button"
          aria-label="Close overlay"
          className={cn(
            "absolute inset-0 bg-zinc-900/40 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={onClose}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-72 bg-white shadow-xl transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {content}
        </aside>
      </div>
    </>
  );
}
