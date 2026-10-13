import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Navigation, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Minhas Viagens" },
      { name: "description", content: "Entre ou crie sua conta no Minhas Viagens para anotar viagens e gerar relatórios mensais." },
      { property: "og:title", content: "Entrar — Minhas Viagens" },
      { property: "og:description", content: "Entre ou crie sua conta no Minhas Viagens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return "E-mail ou senha incorretos.";
  if (/already registered/i.test(message)) return "Este e-mail já tem cadastro. Use a aba Entrar.";
  if (/email not confirmed/i.test(message)) return "Confirme seu e-mail pelo link que enviamos.";
  if (/password should be at least/i.test(message)) return "A senha precisa ter pelo menos 6 caracteres.";
  return message;
}

function AuthPage() {
  const navigate = useNavigate();
  const [signup, setSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      toast.error("Confira os dados", {
        description: "Informe o e-mail e uma senha com pelo menos 6 caracteres.",
      });
      return;
    }
    setBusy(true);
    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Confirme seu e-mail", {
            description: "Enviamos um link de confirmação. Depois de confirmar, volte e entre.",
          });
        } else {
          navigate({ to: "/" });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (e: any) {
      toast.error("Não foi possível continuar", { description: friendly(e?.message ?? "Erro desconhecido") });
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error("Login com Google", { description: friendly(e?.message ?? "Não foi possível entrar com o Google.") });
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      toast.info("Esqueci minha senha", { description: "Digite seu e-mail no campo acima e toque novamente." });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) toast.error("Erro", { description: friendly(error.message) });
    else toast.success("Verifique seu e-mail", { description: "Enviamos um link para redefinir a senha." });
  };

  const inputCls =
    "h-full w-full bg-transparent text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="w-full max-w-md rounded-[2rem] p-[1.5px] gradient-brand">
        <div className="flex flex-col gap-5 rounded-[calc(2rem-1.5px)] bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-brand">
              <Navigation size={30} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Minhas Viagens</h1>
              <p className="text-sm font-medium text-muted-foreground">
                Anote, confirme e acompanhe seus ganhos
              </p>
            </div>
          </div>

          <div className="flex rounded-2xl bg-muted p-1">
            {(["Entrar", "Criar conta"] as const).map((label, i) => {
              const active = signup === (i === 1);
              return (
                <button
                  key={label}
                  onClick={() => setSignup(i === 1)}
                  className={
                    active
                      ? "h-11 flex-1 rounded-xl gradient-brand text-sm font-extrabold text-primary-foreground"
                      : "h-11 flex-1 text-sm font-extrabold text-muted-foreground"
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          {signup && (
            <label className="flex flex-col gap-2">
              <span className="text-xs font-extrabold tracking-widest text-gold uppercase">Nome</span>
              <div className="flex h-13 items-center gap-3 rounded-2xl border border-input bg-background px-4 focus-within:border-ring">
                <User size={20} className="text-muted-foreground" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                  className={inputCls}
                />
              </div>
            </label>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-xs font-extrabold tracking-widest text-gold uppercase">E-mail</span>
            <div className="flex h-13 items-center gap-3 rounded-2xl border border-input bg-background px-4 focus-within:border-ring">
              <Mail size={20} className="text-muted-foreground" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                type="email"
                autoComplete="email"
                className={inputCls}
              />
            </div>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-extrabold tracking-widest text-gold uppercase">Senha</span>
            <div className="flex h-13 items-center gap-3 rounded-2xl border border-input bg-background px-4 focus-within:border-ring">
              <Lock size={20} className="text-muted-foreground" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                type={showPassword ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="text-gold"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </label>

          <button
            onClick={submit}
            disabled={busy}
            className="h-13 rounded-2xl gradient-brand text-base font-extrabold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Aguarde..." : signup ? "Criar conta" : "Entrar"}
          </button>

          {!signup && (
            <button onClick={forgot} className="text-sm font-semibold text-accent hover:underline">
              Esqueci minha senha
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={google}
            disabled={busy}
            className="flex h-13 items-center justify-center gap-3 rounded-2xl border border-input bg-background text-base font-bold text-foreground transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
            </svg>
            Continuar com Google
          </button>
        </div>
      </div>
    </div>
  );
}
