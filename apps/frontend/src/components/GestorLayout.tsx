import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconeSair } from "./icones";

const ITENS_NAV = [
  { para: "/gestor/agregados", rotulo: "Agregados" },
  { para: "/gestor/gestores", rotulo: "Gestores" },
];

export function GestorLayout() {
  const { utilizador, sair } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-slate-800 px-4 py-3 text-white sm:px-8">
        <div className="flex items-center gap-2">
          <img src="/pwa-192.png" alt="" className="h-7 w-7 rounded-md" />
          <span className="text-sm font-semibold">Economia Doméstica — Gestor</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-xs text-slate-300 sm:inline">{utilizador?.nome}</span>
          <button
            onClick={() => void sair()}
            className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
          >
            <IconeSair className="shrink-0" width={18} height={18} />
            Sair
          </button>
        </div>
      </header>
      <nav className="flex gap-1 border-b border-slate-200 bg-white px-4 sm:px-8">
        {ITENS_NAV.map(({ para, rotulo }) => (
          <NavLink
            key={para}
            to={para}
            className={({ isActive }) =>
              `border-b-2 px-3 py-2.5 text-sm font-medium ${
                isActive ? "border-marca-500 text-marca-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`
            }
          >
            {rotulo}
          </NavLink>
        ))}
      </nav>
      <main className="mx-auto max-w-4xl p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
