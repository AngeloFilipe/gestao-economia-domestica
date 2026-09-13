import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { EstadoPeriodo } from "@ged/shared";
import {
  useAtualizarEstadoPeriodo,
  useCategorias,
  useDefinirLinha,
  useOrcadoRealizado,
  usePeriodo,
  useRegra555,
} from "../lib/queries";
import { achatarRubricas } from "../lib/categorias-utils";
import { formatarData, formatarMoeda } from "../lib/formato";
import { RUBRICA_TIPO_PERIODO } from "../lib/periodos";
import { Regra555Painel } from "../components/Regra555Painel";
import { useAuth } from "../context/AuthContext";

const PROXIMO_ESTADO: Record<EstadoPeriodo, EstadoPeriodo | null> = {
  RASCUNHO: "ATIVO",
  ATIVO: "FECHADO",
  FECHADO: null,
};

function BarraProgresso({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-slate-400">sem plano</span>;
  const cor = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-marca-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

export function OrcamentoDetalhePage() {
  const { periodoId } = useParams<{ periodoId: string }>();
  const { utilizador } = useAuth();
  const { data: periodo } = usePeriodo(periodoId);
  const { data: relatorio } = useOrcadoRealizado(periodoId);
  const { data: regra555 } = useRegra555(periodoId);
  const { data: arvore } = useCategorias();
  const atualizarEstado = useAtualizarEstadoPeriodo(periodoId ?? "");
  const definirLinha = useDefinirLinha(periodoId ?? "");
  const [edicao, setEdicao] = useState<Record<string, string>>({});

  const infoCategoria = useMemo(() => {
    const mapa = new Map<string, { grupoNome: string; subcategoriaNome: string | null }>();
    if (arvore) {
      for (const r of achatarRubricas(arvore)) {
        mapa.set(r.id, { grupoNome: r.grupoNome, subcategoriaNome: r.subcategoriaNome });
      }
    }
    return mapa;
  }, [arvore]);

  const linhasDespesa = relatorio?.linhas.filter((l) => l.valorPlaneado > 0 || l.valorRealizado > 0) ?? [];

  const porGrupo = useMemo(() => {
    const mapa = new Map<string, typeof linhasDespesa>();
    for (const linha of linhasDespesa) {
      const grupo = infoCategoria.get(linha.categoriaId)?.grupoNome ?? "Outras";
      if (!mapa.has(grupo)) mapa.set(grupo, []);
      mapa.get(grupo)!.push(linha);
    }
    return mapa;
  }, [linhasDespesa, infoCategoria]);

  if (!periodo || !relatorio) return <p className="text-sm text-slate-500">A carregar…</p>;

  const proximoEstado = PROXIMO_ESTADO[periodo.estado];
  const ehAdmin = utilizador?.papel === "ADMIN";

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            {RUBRICA_TIPO_PERIODO[periodo.tipo]} · {periodo.referencia}
          </h1>
          <p className="text-sm text-slate-500">
            {formatarData(periodo.dataInicio)} — {formatarData(periodo.dataFim)} · Estado: {periodo.estado}
          </p>
        </div>
        {ehAdmin && proximoEstado && (
          <button
            onClick={() => atualizarEstado.mutate(proximoEstado)}
            disabled={atualizarEstado.isPending}
            className="rounded-lg border border-marca-500 px-3 py-1.5 text-sm font-medium text-marca-600 hover:bg-marca-50"
          >
            Marcar como {proximoEstado}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Receita planeada", relatorio.totalReceitaPlaneada, "text-slate-700"],
          ["Receita realizada", relatorio.totalReceitaRealizada, "text-emerald-600"],
          ["Despesa planeada", relatorio.totalDespesaPlaneada, "text-slate-700"],
          ["Despesa realizada", relatorio.totalDespesaRealizada, "text-red-600"],
        ].map(([rotulo, valor, cor]) => (
          <div key={rotulo as string} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-400">{rotulo}</p>
            <p className={`text-sm font-semibold ${cor}`}>{formatarMoeda(valor as number)}</p>
          </div>
        ))}
      </div>

      {regra555 && <Regra555Painel {...regra555} />}

      <div className="space-y-3">
        {Array.from(porGrupo.entries()).map(([grupoNome, linhas]) => (
          <div key={grupoNome} className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">{grupoNome}</h3>
            <div className="space-y-3">
              {linhas.map((linha) => (
                <div key={linha.categoriaId} className="text-sm">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-slate-600">{linha.categoriaNome}</span>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {ehAdmin ? (
                        <>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder={String(linha.valorPlaneado)}
                            value={edicao[linha.categoriaId] ?? ""}
                            onChange={(e) =>
                              setEdicao((v) => ({ ...v, [linha.categoriaId]: e.target.value }))
                            }
                            className="w-24 rounded border border-slate-300 px-1.5 py-0.5 text-right"
                          />
                          <button
                            className="text-marca-600 hover:underline"
                            onClick={() =>
                              definirLinha.mutate({
                                categoriaId: linha.categoriaId,
                                valorPlaneado: Number(edicao[linha.categoriaId] ?? linha.valorPlaneado),
                              })
                            }
                          >
                            Guardar
                          </button>
                        </>
                      ) : (
                        <span>{formatarMoeda(linha.valorPlaneado)}</span>
                      )}
                      <span className="font-medium text-slate-700">{formatarMoeda(linha.valorRealizado)}</span>
                    </div>
                  </div>
                  <BarraProgresso pct={linha.percentualConsumido} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {linhasDespesa.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            Ainda não há linhas planeadas nem movimentos registados para este período.
          </p>
        )}
      </div>
    </div>
  );
}
