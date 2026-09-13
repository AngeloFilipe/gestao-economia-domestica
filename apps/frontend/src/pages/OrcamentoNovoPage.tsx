import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TipoPeriodo } from "@ged/shared";
import { REGRA_555 } from "@ged/shared";
import { useCategorias, useCriarOrcamento } from "../lib/queries";
import { achatarRubricas, agruparPorGrupoESubcategoria } from "../lib/categorias-utils";
import { calcularFimPeriodo, RUBRICA_TIPO_PERIODO, sugerirReferencia } from "../lib/periodos";
import { formatarMoeda } from "../lib/formato";
import { Regra555Painel } from "../components/Regra555Painel";
import { ErroApi } from "../lib/api";

const HOJE_ISO = new Date().toISOString();

export function OrcamentoNovoPage() {
  const navigate = useNavigate();
  const { data: arvore, isLoading } = useCategorias();
  const criarOrcamento = useCriarOrcamento();

  const [tipo, setTipo] = useState<TipoPeriodo>("MENSAL");
  const [dataInicio, setDataInicio] = useState(HOJE_ISO.slice(0, 10));
  const [referencia, setReferencia] = useState(sugerirReferencia("MENSAL", HOJE_ISO));
  const [valores, setValores] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);

  const rubricas = useMemo(() => (arvore ? achatarRubricas(arvore) : []), [arvore]);
  const agrupado = useMemo(() => agruparPorGrupoESubcategoria(rubricas), [rubricas]);

  function aoMudarTipo(novoTipo: TipoPeriodo) {
    setTipo(novoTipo);
    setReferencia(sugerirReferencia(novoTipo, `${dataInicio}T00:00:00.000Z`));
  }

  function aoMudarDataInicio(valor: string) {
    setDataInicio(valor);
    setReferencia(sugerirReferencia(tipo, `${valor}T00:00:00.000Z`));
  }

  const numerico = (id: string) => Number(valores[id] || 0);

  const totalReceita = rubricas.filter((r) => r.tipo === "RECEITA").reduce((s, r) => s + numerico(r.id), 0);
  const totalDespesasFixas = rubricas
    .filter((r) => r.tipo === "DESPESA" && r.grupoNome === "Despesas Fixas")
    .reduce((s, r) => s + numerico(r.id), 0);
  const totalOutrasDespesas = rubricas
    .filter((r) => r.tipo === "DESPESA" && r.grupoNome !== "Despesas Fixas")
    .reduce((s, r) => s + numerico(r.id), 0);
  const poupanca = totalReceita - totalDespesasFixas - totalOutrasDespesas;

  const despesasFixasPct = totalReceita > 0 ? (totalDespesasFixas / totalReceita) * 100 : 0;
  const outrasDespesasPct = totalReceita > 0 ? (totalOutrasDespesas / totalReceita) * 100 : 0;
  const poupancaPct = totalReceita > 0 ? (poupanca / totalReceita) * 100 : 0;

  async function aoSubmeter() {
    setErro(null);
    const linhas = Object.entries(valores)
      .filter(([, v]) => Number(v) > 0)
      .map(([categoriaId, valorPlaneado]) => ({ categoriaId, valorPlaneado: Number(valorPlaneado) }));

    if (linhas.length === 0) {
      setErro("Introduza pelo menos um valor planeado.");
      return;
    }

    try {
      const dataInicioIso = `${dataInicio}T00:00:00.000Z`;
      const periodo = await criarOrcamento.mutateAsync({
        periodo: { tipo, referencia, dataInicio: dataInicioIso, dataFim: calcularFimPeriodo(tipo, dataInicioIso) },
        linhas,
      });
      navigate(`/orcamento/${periodo.id}`);
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não foi possível criar o orçamento.");
    }
  }

  if (isLoading) return <p className="text-sm text-slate-500">A carregar categorias…</p>;

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <h1 className="mb-1 text-xl font-semibold text-slate-800">Novo orçamento</h1>
      <p className="mb-6 text-sm text-slate-500">
        Baseado no modelo do MINFIN — recomendação: 55% despesas fixas, 45% outras despesas, mínimo 5% de poupança.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Periodicidade</label>
          <select
            value={tipo}
            onChange={(e) => aoMudarTipo(e.target.value as TipoPeriodo)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {Object.entries(RUBRICA_TIPO_PERIODO).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Início do período</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => aoMudarDataInicio(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Referência</label>
          <input
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {Array.from(agrupado.entries()).map(([grupoNome, porSub]) => (
            <details key={grupoNome} open className="rounded-xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">{grupoNome}</summary>
              <div className="mt-3 space-y-4">
                {Array.from(porSub.entries()).map(([subNome, itens]) => (
                  <div key={subNome}>
                    {subNome !== "__direto__" && (
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">{subNome}</p>
                    )}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {itens.map((item) => (
                        <label key={item.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-slate-600">{item.nome}</span>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0,00"
                            value={valores[item.id] ?? ""}
                            onChange={(e) => setValores((v) => ({ ...v, [item.id]: e.target.value }))}
                            className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <p className="flex justify-between py-1">
              <span className="text-slate-500">Receitas planeadas</span>
              <span className="font-medium text-emerald-600">{formatarMoeda(totalReceita)}</span>
            </p>
            <p className="flex justify-between py-1">
              <span className="text-slate-500">Despesas fixas</span>
              <span className="font-medium text-slate-700">{formatarMoeda(totalDespesasFixas)}</span>
            </p>
            <p className="flex justify-between py-1">
              <span className="text-slate-500">Outras despesas</span>
              <span className="font-medium text-slate-700">{formatarMoeda(totalOutrasDespesas)}</span>
            </p>
            <p className="flex justify-between border-t border-slate-100 py-1 pt-2">
              <span className="text-slate-500">Saldo planeado</span>
              <span className={`font-semibold ${poupanca >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatarMoeda(poupanca)}
              </span>
            </p>
          </div>

          <Regra555Painel
            despesasFixasPct={despesasFixasPct}
            outrasDespesasPct={outrasDespesasPct}
            poupancaPct={poupancaPct}
            cumpreDespesasFixas={despesasFixasPct <= REGRA_555.despesasFixasPct}
            cumpreOutrasDespesas={outrasDespesasPct <= REGRA_555.outrasDespesasPct}
            cumprePoupancaMinima={poupancaPct >= REGRA_555.poupancaMinimaPct}
          />

          {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

          <button
            onClick={() => void aoSubmeter()}
            disabled={criarOrcamento.isPending}
            className="w-full rounded-lg bg-marca-500 py-2.5 text-sm font-semibold text-white hover:bg-marca-600 disabled:opacity-60"
          >
            {criarOrcamento.isPending ? "A criar…" : "Criar orçamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
