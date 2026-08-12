"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface AdminShellProps {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminShell({ title, actions, children }: AdminShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          title={title}
          actions={actions}
          onMenuClick={() => setMenuOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
