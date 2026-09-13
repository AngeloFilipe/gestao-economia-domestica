import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAlertas } from "../lib/queries";
import {
  IconeAlertas,
  IconeMembros,
  IconeMovimentos,
  IconeOrcamento,
  IconeRelatorios,
  IconeSair,
} from "./icones";

const ITENS_NAV = [
  { para: "/orcamento", rotulo: "Orçamento", Icone: IconeOrcamento },
  { para: "/movimentos", rotulo: "Movimentos", Icone: IconeMovimentos },
  { para: "/relatorios", rotulo: "Relatórios", Icone: IconeRelatorios },
  { para: "/alertas", rotulo: "Alertas", Icone: IconeAlertas },
  { para: "/membros", rotulo: "Família", Icone: IconeMembros },
];

function classeNav(ativo: boolean) {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    ativo ? "bg-marca-500 text-white" : "text-slate-600 hover:bg-marca-50 hover:text-marca-700"
  }`;
}

export function Layout() {
  const { utilizador, sair } = useAuth();
  const { data: alertas } = useAlertas(true);
  const naoLidos = alertas?.length ?? 0;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar — desktop/tablet */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <img src="/pwa-192.png" alt="" className="h-8 w-8 rounded-md" />
          <span className="text-sm font-semibold text-marca-700">Economia Doméstica</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {ITENS_NAV.map(({ para, rotulo, Icone }) => (
            <NavLink key={para} to={para} className={({ isActive }) => classeNav(isActive)}>
              <Icone className="shrink-0" />
              <span>{rotulo}</span>
              {para === "/alertas" && naoLidos > 0 && (
                <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{naoLidos}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 pt-3">
          <p className="px-2 text-xs text-slate-500">{utilizador?.nome}</p>
          <button
            onClick={() => void sair()}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <IconeSair className="shrink-0" />
            Terminar sessão
          </button>
        </div>
      </aside>

      {/* Cabeçalho — mobile */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <img src="/pwa-192.png" alt="" className="h-7 w-7 rounded-md" />
          <span className="text-sm font-semibold text-marca-700">Economia Doméstica</span>
        </div>
        <button onClick={() => void sair()} className="text-slate-500">
          <IconeSair />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 pb-20 md:p-8 md:pb-8">
        <Outlet />
      </main>

      {/* Navegação inferior — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white md:hidden">
        {ITENS_NAV.map(({ para, rotulo, Icone }) => (
          <NavLink
            key={para}
            to={para}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                isActive ? "text-marca-600" : "text-slate-500"
              }`
            }
          >
            <Icone width={20} height={20} />
            {rotulo}
            {para === "/alertas" && naoLidos > 0 && (
              <span className="absolute right-4 top-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
