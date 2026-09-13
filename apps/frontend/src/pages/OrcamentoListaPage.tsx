import { Link } from "react-router-dom";
import { usePeriodos } from "../lib/queries";
import { formatarData, formatarMoeda } from "../lib/formato";
import { RUBRICA_TIPO_PERIODO } from "../lib/periodos";
import { IconeMais } from "../components/icones";

const CORES_ESTADO: Record<string, string> = {
  RASCUNHO: "bg-slate-100 text-slate-600",
  ATIVO: "bg-emerald-100 text-emerald-700",
  FECHADO: "bg-slate-200 text-slate-500",
};

export function OrcamentoListaPage() {
  const { data: periodos, isLoading } = usePeriodos();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Orçamentos</h1>
          <p className="text-sm text-slate-500">Previsão de receitas e despesas por período.</p>
        </div>
        <Link
          to="/orcamento/novo"
          className="flex items-center gap-1.5 rounded-lg bg-marca-500 px-3 py-2 text-sm font-medium text-white hover:bg-marca-600"
        >
          <IconeMais width={18} height={18} />
          Novo orçamento
        </Link>
      </div>

      {isLoading && <p className="text-sm text-slate-500">A carregar…</p>}

      {!isLoading && periodos?.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Ainda não tem nenhum orçamento criado. Comece por criar o orçamento mensal do mês atual.
        </div>
      )}

      <div className="space-y-3">
        {periodos?.map((periodo) => {
          const saldoPlaneado = periodo.totalReceitaPlaneada - periodo.totalDespesaPlaneada;
          return (
            <Link
              key={periodo.id}
              to={`/orcamento/${periodo.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      {RUBRICA_TIPO_PERIODO[periodo.tipo]} · {periodo.referencia}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CORES_ESTADO[periodo.estado]}`}>
                      {periodo.estado}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatarData(periodo.dataInicio)} — {formatarData(periodo.dataFim)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Saldo planeado</p>
                  <p className={`text-sm font-semibold ${saldoPlaneado >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatarMoeda(saldoPlaneado)}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
