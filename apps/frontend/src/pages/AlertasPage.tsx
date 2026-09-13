import { useState } from "react";
import type { NivelAlerta } from "@ged/shared";
import { useAlertas, useMarcarAlertaLido } from "../lib/queries";
import { formatarMoeda } from "../lib/formato";

const ESTILO_NIVEL: Record<NivelAlerta, string> = {
  AVISO: "border-amber-300 bg-amber-50 text-amber-800",
  CRITICO: "border-red-300 bg-red-50 text-red-800",
  RISCO_RUTURA: "border-purple-300 bg-purple-50 text-purple-800",
};

const ROTULO_NIVEL: Record<NivelAlerta, string> = {
  AVISO: "Aviso — 80% do planeado",
  CRITICO: "Crítico — 100% do planeado",
  RISCO_RUTURA: "Risco de rutura orçamental",
};

export function AlertasPage() {
  const [apenasNaoLidos, setApenasNaoLidos] = useState(true);
  const { data: alertas, isLoading } = useAlertas(apenasNaoLidos);
  const marcarLido = useMarcarAlertaLido();

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Alertas</h1>
          <p className="text-sm text-slate-500">Avisos de consumo do orçamento e risco de rutura.</p>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          <input type="checkbox" checked={apenasNaoLidos} onChange={(e) => setApenasNaoLidos(e.target.checked)} />
          Só não lidos
        </label>
      </div>

      {isLoading && <p className="text-sm text-slate-500">A carregar…</p>}

      {!isLoading && alertas?.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Sem alertas — o orçamento está sob controlo. 🎉
        </div>
      )}

      <div className="space-y-3">
        {alertas?.map((alerta) => (
          <div key={alerta.id} className={`rounded-xl border p-4 ${ESTILO_NIVEL[alerta.nivel]}`}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide">{ROTULO_NIVEL[alerta.nivel]}</span>
              {!alerta.lidoEm && (
                <button
                  onClick={() => marcarLido.mutate(alerta.id)}
                  className="text-xs font-medium underline underline-offset-2"
                >
                  Marcar como lido
                </button>
              )}
            </div>
            <p className="text-sm">{alerta.mensagem}</p>
            {alerta.categoriaNome && <p className="mt-1 text-xs opacity-70">Categoria: {alerta.categoriaNome}</p>}
            {alerta.valorReferencia !== null && alerta.nivel === "RISCO_RUTURA" && (
              <p className="mt-1 text-xs opacity-70">Saldo projetado: {formatarMoeda(alerta.valorReferencia)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
