// app/admin/login/page.tsx
import { adminLogin } from "./actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const error = sp?.error === "1";
  const next = sp?.next || "/admin";

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">Admin Login</h1>
      <p className="text-muted-foreground mb-6">
        Enter the admin token to access editing tools.
      </p>

      {error && (
        <div className="mb-4 border border-red-200 bg-red-50 text-red-700 rounded p-3 text-sm">
          Invalid token.
        </div>
      )}

      <form action={adminLogin} className="space-y-4 border rounded-lg p-6 bg-card">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="token">
            Admin Token
          </label>
          <input
            id="token"
            name="token"
            type="password"
            required
            className="w-full border rounded px-3 py-2"
            placeholder="Paste token here"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-primary text-primary-foreground px-4 py-2 font-semibold"
        >
          Sign in
        </button>

        <p className="text-xs text-muted-foreground">
          Tip: set ADMIN_TOKEN in your hosting secrets (Vercel) and keep it out of git.
        </p>
      </form>
    </div>
  );
}
