import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  grokOAuthEnabled,
  signIn,
} from "@/lib/auth/client";
import { ClubMark } from "@/components/club/mark";
import { Disclaimer } from "@/components/club/disclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0] || "Thành viên",
          callbackURL: "/",
        });
        if (res.error) throw new Error(res.error.message || "Không tạo được tài khoản.");
      } else {
        const res = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/",
        });
        if (res.error) throw new Error(res.error.message || "Sai email hoặc mật khẩu.");
      }
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đăng nhập được.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-7 shadow-[var(--shadow-soft)]">
        <Link to="/" className="flex items-center gap-2 text-fg">
          <ClubMark className="size-8 text-accent" />
          <span className="font-display text-2xl">Kim Lân</span>
        </Link>
        <h1 className="mt-6 font-display text-3xl">Vào câu lạc bộ</h1>
        <p className="mt-2 text-sm text-muted">
          Tài khoản để giữ xu ảo trên mọi thiết bị. Không yêu cầu nạp tiền.
        </p>

        {authEnabled ? (
          <div className="mt-6 space-y-5">
            {grokOAuthEnabled ? <div className="space-y-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                >
                  Tiếp tục với {p.label}
                </Button>
              ))}
            </div> : null}
            {grokOAuthEnabled ? <p className="text-center text-xs uppercase tracking-[0.18em] text-subtle">
              hoặc email
            </p> : null}
            <form className="space-y-3" onSubmit={onEmail}>
              {mode === "up" ? (
                <Input
                  placeholder="Tên hiển thị"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              ) : null}
              <Input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Input
                type="password"
                required
                minLength={8}
                placeholder="Mật khẩu (từ 8 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "up" ? "new-password" : "current-password"}
              />
              {error ? <p className="text-sm text-lose">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Đang xử lý…" : mode === "up" ? "Tạo tài khoản" : "Đăng nhập"}
              </Button>
            </form>
            <button
              type="button"
              className="w-full text-sm text-muted hover:text-fg"
              onClick={() => setMode(mode === "up" ? "in" : "up")}
            >
              {mode === "up" ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
            </button>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">Đăng nhập đang tắt.</p>
        )}
        <Disclaimer className="mt-6" />
      </div>
    </main>
  );
}
