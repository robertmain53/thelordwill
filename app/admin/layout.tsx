// app/admin/layout.tsx
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-background">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="font-semibold">
            Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="hover:underline" href="/admin/prayer-points">
              Prayer Points
            </Link>
            <Link className="hover:underline" href="/">
              View Site
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
