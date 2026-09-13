import { useMemo, useState } from "react";
import type { MetodoPagamento, TipoFluxo } from "@ged/shared";
import { useCategorias, useCriarMovimento, useMovimentos, usePeriodos, useRemoverMovimento } from "../lib/queries";
import { achatarRubricas } from "../lib/categorias-utils";
import { resolverLinhaOrcamentada } from "../lib/periodos";
import { formatarData, formatarMoeda } from "../lib/formato";
import { ErroApi } from "../lib/api";

const METODOS: { valor: MetodoPagamento; rotulo: string }[] = [
  { valor: "DINHEIRO", rotulo: "Dinheiro" },
  { valor: "MULTICAIXA", rotulo: "Multicaixa" },
  { valor: "TRANSFERENCIA", rotulo: "Transferência" },
  { valor: "CARTAO_DEBITO", rotulo: "Cartão de débito" },
  { valor: "CARTAO_CREDITO", rotulo: "Cartão de crédito" },
  { valor: "OUTRO", rotulo: "Outro" },
];

export function MovimentosPage() {
  const { data: arvore } = useCategorias();
  const { data: periodos } = usePeriodos();
  const criarMovimento = useCriarMovimento();
  const removerMovimento = useRemoverMovimento();

  const rubricas = useMemo(() => (arvore ? achatarRubricas(arvore) : []), [arvore]);

  const [tipo, setTipo] = useState<TipoFluxo>("DESPESA");
  const [categoriaId, setCategoriaId] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>("DINHEIRO");
  const [erro, setErro] = useState<string | null>(null);

  const [filtroApenasNaoPrevistas, setFiltroApenasNaoPrevistas] = useState(false);
  const [filtroCategoriaId, setFiltroCategoriaId] = useState("");
  const { data: movimentos, isLoading } = useMovimentos({
    apenasNaoPrevistas: filtroApenasNaoPrevistas || undefined,
    categoriaId: filtroCategoriaId || undefined,
  });

  const rubricasDoTipo = rubricas.filter((r) => r.tipo === tipo);
  const dataIso = `${data}T12:00:00.000Z`;
  const resolucao = categoriaId && periodos ? resolverLinhaOrcamentada(periodos, categoriaId, dataIso) : null;

  async function aoSubmeter() {
    setErro(null);
    if (!categoriaId || !valor) {
      setErro("Escolha a categoria e indique o valor.");
      return;
    }
    try {
      await criarMovimento.mutateAsync({
        data: dataIso,
        valor: Number(valor),
        tipo,
        categoriaId,
        linhaOrcamentadaId: resolucao?.linhaId ?? null,
        descricao: descricao || null,
        metodoPagamento,
      });
      setValor("");
      setDescricao("");
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não foi possível registar o movimento.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Registo diário</h1>
        <p className="text-sm text-slate-500">Lance compras, manutenções e outras despesas ou receitas do dia-a-dia.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex gap-2">
          {(["DESPESA", "RECEITA"] as TipoFluxo[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTipo(t);
                setCategoriaId("");
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                tipo === t ? "bg-marca-500 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {t === "DESPESA" ? "Despesa" : "Receita"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">Categoria</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione…</option>
              {rubricasDoTipo.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.grupoNome}
                  {r.subcategoriaNome ? ` › ${r.subcategoriaNome}` : ""} › {r.nome}
                </option>
              ))}
            </select>
            {categoriaId && (
              <p className={`mt-1 text-xs ${resolucao ? "text-emerald-600" : "text-amber-600"}`}>
                {resolucao
                  ? `Prevista — conta para o orçamento ${resolucao.periodo.referencia}.`
                  : "Não prevista — não há linha orçamentada para esta categoria/data."}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Valor (AOA)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">Descrição (opcional)</label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ex.: compras do mês"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">Método de pagamento</label>
            <select
              value={metodoPagamento}
              onChange={(e) => setMetodoPagamento(e.target.value as MetodoPagamento)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {METODOS.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {erro && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

        <button
          onClick={() => void aoSubmeter()}
          disabled={criarMovimento.isPending}
          className="mt-4 w-full rounded-lg bg-marca-500 py-2.5 text-sm font-semibold text-white hover:bg-marca-600 disabled:opacity-60"
        >
          {criarMovimento.isPending ? "A registar…" : "Registar movimento"}
        </button>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-800">Movimentos recentes</h2>
          <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={filtroApenasNaoPrevistas}
              onChange={(e) => setFiltroApenasNaoPrevistas(e.target.checked)}
            />
            Só não previstas
          </label>
          <select
            value={filtroCategoriaId}
            onChange={(e) => setFiltroCategoriaId(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
          >
            <option value="">Todas as categorias</option>
            {rubricas.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
        </div>

        {isLoading && <p className="text-sm text-slate-500">A carregar…</p>}

        <div className="space-y-2">
          {movimentos?.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {m.categoriaNome}
                  {!m.prevista && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      não prevista
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {formatarData(m.data)} · {m.registadoPorNome} {m.descricao ? `· ${m.descricao}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${m.tipo === "RECEITA" ? "text-emerald-600" : "text-red-600"}`}>
                  {m.tipo === "RECEITA" ? "+" : "-"}
                  {formatarMoeda(m.valor)}
                </span>
                <button
                  onClick={() => removerMovimento.mutate(m.id)}
                  className="text-xs text-slate-400 hover:text-red-600"
                  aria-label="Remover"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}

          {movimentos?.length === 0 && !isLoading && (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Sem movimentos para os filtros selecionados.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
