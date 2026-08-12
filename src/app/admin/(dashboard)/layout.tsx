import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin({ unauthorizedRedirect: "/admin/unauthorized" });
  return children;
}
