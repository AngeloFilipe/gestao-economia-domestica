import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConvidarGestorInput } from "@ged/shared";
import { useAuth } from "../context/AuthContext";
import { useConvidarGestor, useGestores } from "../lib/queries";
import { ErroApi } from "../lib/api";

export function GestorGestoresPage() {
  const { utilizador } = useAuth();
  const { data: gestores, isLoading } = useGestores();
  const convidarGestor = useConvidarGestor();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConvidarGestorInput>({ resolver: zodResolver(ConvidarGestorInput) });

  async function aoSubmeter(dados: ConvidarGestorInput) {
    setErro(null);
    setSucesso(null);
    try {
      await convidarGestor.mutateAsync(dados);
      reset({ nome: "", email: "", password: "" });
      setSucesso(`Gestor "${dados.nome}" criado — email: ${dados.email}.`);
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não foi possível criar o gestor.");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Gestores da aplicação</h1>
        <p className="text-sm text-slate-500">
          Quem tem acesso a criar agregados familiares e outros gestores. Nenhum gestor
          pertence a um agregado.
        </p>
      </div>

      <div className="space-y-2">
        {isLoading && <p className="text-sm text-slate-500">A carregar…</p>}
        {gestores?.map((g) => (
          <div key={g.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
            <div>
              <p className="text-sm font-medium text-slate-700">
                {g.nome}
                {g.id === utilizador?.id && <span className="ml-2 text-xs text-slate-400">(você)</span>}
              </p>
              <p className="text-xs text-slate-400">{g.email}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">GESTOR</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Adicionar gestor</h2>
        <form onSubmit={handleSubmit(aoSubmeter)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Nome</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register("nome")} />
            {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              {...register("email")}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">Password inicial</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              {...register("password")}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          {erro && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
          {sucesso && (
            <p className="sm:col-span-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{sucesso}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="sm:col-span-2 rounded-lg bg-marca-500 py-2.5 text-sm font-semibold text-white hover:bg-marca-600 disabled:opacity-60"
          >
            {isSubmitting ? "A adicionar…" : "Adicionar gestor"}
          </button>
        </form>
      </div>
    </div>
  );
}
