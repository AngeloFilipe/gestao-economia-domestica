import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CriarAgregadoInput } from "@ged/shared";
import { useAgregados, useCriarAgregado } from "../lib/queries";
import { formatarData } from "../lib/formato";
import { ErroApi } from "../lib/api";

export function GestorAgregadosPage() {
  const { data: agregados, isLoading } = useAgregados();
  const criarAgregado = useCriarAgregado();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CriarAgregadoInput>({ resolver: zodResolver(CriarAgregadoInput) });

  async function aoSubmeter(dados: CriarAgregadoInput) {
    setErro(null);
    setSucesso(null);
    try {
      const agregado = await criarAgregado.mutateAsync(dados);
      reset({ nomeAgregado: "", nomeAdmin: "", emailAdmin: "", passwordAdmin: "" });
      setSucesso(`Agregado "${agregado.nome}" criado — administrador: ${dados.emailAdmin}.`);
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não foi possível criar o agregado.");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Agregados familiares</h1>
        <p className="text-sm text-slate-500">
          Cria aqui cada agregado (ex.: "COSTAFILIPES") e o respetivo administrador. O
          administrador pode depois entrar e cadastrar mais membros do seu próprio agregado.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Novo agregado</h2>
        <form onSubmit={handleSubmit(aoSubmeter)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">Nome do agregado</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ex.: COSTAFILIPES"
              {...register("nomeAgregado")}
            />
            {errors.nomeAgregado && <p className="mt-1 text-xs text-red-600">{errors.nomeAgregado.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Nome do administrador</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register("nomeAdmin")} />
            {errors.nomeAdmin && <p className="mt-1 text-xs text-red-600">{errors.nomeAdmin.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Email do administrador</label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              {...register("emailAdmin")}
            />
            {errors.emailAdmin && <p className="mt-1 text-xs text-red-600">{errors.emailAdmin.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">Password inicial do administrador</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              {...register("passwordAdmin")}
            />
            {errors.passwordAdmin && <p className="mt-1 text-xs text-red-600">{errors.passwordAdmin.message}</p>}
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
            {isSubmitting ? "A criar…" : "Criar agregado"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Agregados existentes</h2>
        {isLoading && <p className="text-sm text-slate-500">A carregar…</p>}
        <div className="space-y-2">
          {agregados?.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
              <div>
                <p className="text-sm font-medium text-slate-700">{a.nome}</p>
                <p className="text-xs text-slate-400">Criado em {formatarData(a.criadoEm)}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {a.totalMembros} {a.totalMembros === 1 ? "membro" : "membros"}
              </span>
            </div>
          ))}
          {agregados?.length === 0 && !isLoading && (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Ainda não existe nenhum agregado — cria o primeiro acima.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
