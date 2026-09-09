"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-2xl text-brand-navy mb-8">
          Home7 <span className="text-brand-gold-dark">Admin</span>
        </p>
        <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="font-display text-xl text-brand-navy">Sign in</h1>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
            />
            <input
              name="password"
              type="password"
              required
              placeholder="Password"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gold text-brand-navy rounded px-4 py-2.5 font-semibold hover:brightness-95 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
