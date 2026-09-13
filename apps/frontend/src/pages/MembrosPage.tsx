import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConvidarMembroInput } from "@ged/shared";
import { useAuth } from "../context/AuthContext";
import { useConvidarMembro, useMembros } from "../lib/queries";
import { ErroApi } from "../lib/api";

export function MembrosPage() {
  const { utilizador } = useAuth();
  const { data: membros } = useMembros();
  const convidarMembro = useConvidarMembro();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConvidarMembroInput>({
    resolver: zodResolver(ConvidarMembroInput),
    defaultValues: { papel: "MEMBRO" },
  });

  async function aoSubmeter(dados: ConvidarMembroInput) {
    setErro(null);
    setSucesso(false);
    try {
      await convidarMembro.mutateAsync(dados);
      reset({ papel: "MEMBRO", nome: "", email: "", password: "" });
      setSucesso(true);
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não foi possível adicionar o membro.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Família</h1>
        <p className="text-sm text-slate-500">Membros com acesso ao orçamento partilhado.</p>
      </div>

      <div className="space-y-2">
        {membros?.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
            <div>
              <p className="text-sm font-medium text-slate-700">{m.nome}</p>
              <p className="text-xs text-slate-400">{m.email}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{m.papel}</span>
          </div>
        ))}
      </div>

      {utilizador?.papel === "ADMIN" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Adicionar membro</h2>
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
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Password inicial</label>
              <input
                type="password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                {...register("password")}
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Papel</label>
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register("papel")}>
                <option value="MEMBRO">Membro</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            {erro && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
            {sucesso && (
              <p className="sm:col-span-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Membro adicionado com sucesso.
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="sm:col-span-2 rounded-lg bg-marca-500 py-2.5 text-sm font-semibold text-white hover:bg-marca-600 disabled:opacity-60"
            >
              {isSubmitting ? "A adicionar…" : "Adicionar membro"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
