import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCategories } from "@/lib/firestore/categories";
import { getPostStats } from "@/lib/firestore/posts";

export default async function AdminDashboardPage() {
  const [stats, categories] = await Promise.all([
    getPostStats(),
    getCategories(),
  ]);

  const cards = [
    { label: "Total Posts", value: stats.total, href: "/admin/posts" },
    {
      label: "Published",
      value: stats.published,
      href: "/admin/posts?status=published",
    },
    {
      label: "Drafts",
      value: stats.drafts,
      href: "/admin/posts?status=draft",
    },
    {
      label: "Categories",
      value: categories.length,
      href: "/admin/categories",
    },
  ];

  return (
    <AdminShell title="Dashboard">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-[#b87333]/40"
            >
              <p className="text-sm text-zinc-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">
                {card.value}
              </p>
            </Link>
          ))}
        </div>

        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Quick links
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { href: "/admin/posts", label: "Posts" },
              { href: "/admin/posts/new", label: "New post" },
              { href: "/admin/categories", label: "Categories" },
              { href: "/admin/media", label: "Media" },
              { href: "/admin/social", label: "Socials" },
              { href: "/admin/settings", label: "Settings" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
