import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegistarFamiliaInput } from "@ged/shared";
import { useAuth } from "../context/AuthContext";
import { ErroApi } from "../lib/api";

export function RegistarPage() {
  const { registar } = useAuth();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistarFamiliaInput>({ resolver: zodResolver(RegistarFamiliaInput) });

  async function aoSubmeter(dados: RegistarFamiliaInput) {
    setErro(null);
    try {
      await registar(dados);
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não foi possível criar a família.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-marca-50 px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <img src="/pwa-192.png" alt="" className="h-14 w-14 rounded-xl" />
          <h1 className="text-lg font-semibold text-slate-800">Criar a sua família</h1>
          <p className="text-center text-sm text-slate-500">Fica como administrador(a) da conta.</p>
        </div>

        <form onSubmit={handleSubmit(aoSubmeter)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nome da família</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500"
              placeholder="Família Silva"
              {...register("nomeFamilia")}
            />
            {errors.nomeFamilia && <p className="mt-1 text-xs text-red-600">{errors.nomeFamilia.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">O seu nome</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500"
              {...register("nomeUtilizador")}
            />
            {errors.nomeUtilizador && <p className="mt-1 text-xs text-red-600">{errors.nomeUtilizador.message}</p>}
          </div>
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
            {isSubmitting ? "A criar…" : "Criar família"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-marca-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
