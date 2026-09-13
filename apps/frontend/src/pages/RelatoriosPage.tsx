import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCategorias, useOrcadoRealizado, usePeriodos, useRegra555, useSaldoMensal } from "../lib/queries";
import { achatarRubricas } from "../lib/categorias-utils";
import { formatarMesReferencia, formatarMoeda, formatarMoedaCompacta } from "../lib/formato";
import { RUBRICA_TIPO_PERIODO } from "../lib/periodos";
import { Regra555Painel } from "../components/Regra555Painel";

export function RelatoriosPage() {
  const { data: periodos } = usePeriodos();
  const { data: saldoMensal } = useSaldoMensal(12);
  const { data: arvore } = useCategorias();

  const [periodoId, setPeriodoId] = useState<string>("");

  useEffect(() => {
    if (!periodoId && periodos && periodos.length > 0) {
      const ativo = periodos.find((p) => p.estado === "ATIVO") ?? periodos[0];
      setPeriodoId(ativo.id);
    }
  }, [periodos, periodoId]);

  const { data: relatorio } = useOrcadoRealizado(periodoId || undefined);
  const { data: regra555 } = useRegra555(periodoId || undefined);

  const infoCategoria = useMemo(() => {
    const mapa = new Map<string, string>();
    if (arvore) for (const r of achatarRubricas(arvore)) mapa.set(r.id, r.grupoNome);
    return mapa;
  }, [arvore]);

  const porGrupo = useMemo(() => {
    if (!relatorio) return [];
    const acumulado = new Map<string, { grupo: string; planeado: number; realizado: number }>();
    for (const linha of relatorio.linhas) {
      const grupo = infoCategoria.get(linha.categoriaId) ?? "Outras";
      if (!acumulado.has(grupo)) acumulado.set(grupo, { grupo, planeado: 0, realizado: 0 });
      const item = acumulado.get(grupo)!;
      item.planeado += linha.valorPlaneado;
      item.realizado += linha.valorRealizado;
    }
    return Array.from(acumulado.values());
  }, [relatorio, infoCategoria]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-24">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Relatórios</h1>
        <p className="text-sm text-slate-500">Acompanhamento do orçado vs. realizado e da regra 55/45/5.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Saldo mensal (últimos 12 meses)</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <ComposedChart data={saldoMensal ?? []} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" tickFormatter={formatarMesReferencia} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} width={64} tickFormatter={(v) => formatarMoedaCompacta(v)} />
              <Tooltip
                labelFormatter={(v) => formatarMesReferencia(String(v))}
                formatter={(valor: number) => formatarMoeda(valor)}
              />
              <Legend />
              <Bar dataKey="receitas" name="Receitas" fill="#1a9a97" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#f87171" radius={[4, 4, 0, 0]} />
              <Line dataKey="saldo" name="Saldo" stroke="#0a5c60" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800">Orçado vs. realizado por grupo</h2>
          <select
            value={periodoId}
            onChange={(e) => setPeriodoId(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
          >
            {periodos?.map((p) => (
              <option key={p.id} value={p.id}>
                {RUBRICA_TIPO_PERIODO[p.tipo]} · {p.referencia}
              </option>
            ))}
          </select>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <ComposedChart data={porGrupo} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="grupo" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} width={64} tickFormatter={(v) => formatarMoedaCompacta(v)} />
              <Tooltip formatter={(valor: number) => formatarMoeda(valor)} />
              <Legend />
              <Bar dataKey="planeado" name="Planeado" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realizado" name="Realizado" fill="#0d7377" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {regra555 && <Regra555Painel {...regra555} />}
    </div>
  );
}
