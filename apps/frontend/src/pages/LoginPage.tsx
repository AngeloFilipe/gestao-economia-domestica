import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginInput } from "@ged/shared";
import { useAuth } from "../context/AuthContext";
import { ErroApi } from "../lib/api";

export function LoginPage() {
  const { entrar } = useAuth();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginInput) });

  async function aoSubmeter(dados: LoginInput) {
    setErro(null);
    try {
      await entrar(dados);
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não foi possível iniciar sessão.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-marca-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <img src="/pwa-192.png" alt="" className="h-14 w-14 rounded-xl" />
          <h1 className="text-lg font-semibold text-slate-800">Gestão de Economia Doméstica</h1>
          <p className="text-center text-sm text-slate-500">Entre para gerir o orçamento da sua família.</p>
        </div>

        <form onSubmit={handleSubmit(aoSubmeter)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500"
              {...register("email")}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500"
              {...register("password")}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-marca-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-marca-600 disabled:opacity-60"
          >
            {isSubmitting ? "A entrar…" : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Ainda não tem família registada?{" "}
          <Link to="/registar" className="font-medium text-marca-600 hover:underline">
            Criar agora
          </Link>
        </p>
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-slate-400">
          Demo: ana@familia.demo / Demo1234!
        </p>
      </div>
    </div>
  );
}
