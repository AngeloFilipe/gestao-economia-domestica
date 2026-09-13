interface Props {
  despesasFixasPct: number;
  outrasDespesasPct: number;
  poupancaPct: number;
  cumpreDespesasFixas: boolean;
  cumpreOutrasDespesas: boolean;
  cumprePoupancaMinima: boolean;
}

function Linha({
  rotulo,
  valorPct,
  metaPct,
  cumpre,
  cor,
}: {
  rotulo: string;
  valorPct: number;
  metaPct: string;
  cumpre: boolean;
  cor: string;
}) {
  const largura = Math.min(100, Math.max(0, valorPct));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{rotulo}</span>
        <span className={cumpre ? "text-emerald-600" : "text-red-600"}>
          {valorPct.toFixed(1)}%{" "}
          <span className="text-slate-400">(meta {metaPct})</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${cumpre ? cor : "bg-red-500"}`}
          style={{ width: `${largura}%` }}
        />
      </div>
    </div>
  );
}

export function Regra555Painel(props: Props) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-800">Regra 55 / 45 / 5 (MINFIN)</h3>
      <Linha
        rotulo="Despesas fixas"
        valorPct={props.despesasFixasPct}
        metaPct="≤ 55%"
        cumpre={props.cumpreDespesasFixas}
        cor="bg-marca-500"
      />
      <Linha
        rotulo="Outras despesas"
        valorPct={props.outrasDespesasPct}
        metaPct="≤ 45%"
        cumpre={props.cumpreOutrasDespesas}
        cor="bg-marca-400"
      />
      <Linha
        rotulo="Poupança"
        valorPct={props.poupancaPct}
        metaPct="≥ 5%"
        cumpre={props.cumprePoupancaMinima}
        cor="bg-amber-500"
      />
    </div>
  );
}
