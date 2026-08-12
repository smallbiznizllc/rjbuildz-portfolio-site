"use client";

import { Menu } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
}

export function AdminHeader({ title, onMenuClick, actions }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-[family-name:var(--font-dm-sans)] text-lg font-semibold text-zinc-900 sm:text-xl">
          {title}
        </h1>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
