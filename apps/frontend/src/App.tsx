import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { RegistarPage } from "./pages/RegistarPage";
import { OrcamentoListaPage } from "./pages/OrcamentoListaPage";
import { OrcamentoNovoPage } from "./pages/OrcamentoNovoPage";
import { OrcamentoDetalhePage } from "./pages/OrcamentoDetalhePage";
import { MovimentosPage } from "./pages/MovimentosPage";
import { AlertasPage } from "./pages/AlertasPage";
import { MembrosPage } from "./pages/MembrosPage";

// Carregado à parte porque arrasta a biblioteca de gráficos (recharts) — não
// há motivo para todos os ecrãs pagarem esse custo no carregamento inicial.
const RelatoriosPage = lazy(() => import("./pages/RelatoriosPage").then((m) => ({ default: m.RelatoriosPage })));

function EcraCarregamento() {
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-500">
      <p>A carregar…</p>
    </div>
  );
}

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { utilizador, carregando } = useAuth();
  if (carregando) return <EcraCarregamento />;
  if (!utilizador) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RotaPublica({ children }: { children: React.ReactNode }) {
  const { utilizador, carregando } = useAuth();
  if (carregando) return <EcraCarregamento />;
  if (utilizador) return <Navigate to="/orcamento" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<RotaPublica><LoginPage /></RotaPublica>} />
      <Route path="/registar" element={<RotaPublica><RegistarPage /></RotaPublica>} />

      <Route
        element={
          <RotaProtegida>
            <Layout />
          </RotaProtegida>
        }
      >
        <Route index element={<Navigate to="/orcamento" replace />} />
        <Route path="/orcamento" element={<OrcamentoListaPage />} />
        <Route path="/orcamento/novo" element={<OrcamentoNovoPage />} />
        <Route path="/orcamento/:periodoId" element={<OrcamentoDetalhePage />} />
        <Route path="/movimentos" element={<MovimentosPage />} />
        <Route
          path="/relatorios"
          element={
            <Suspense fallback={<EcraCarregamento />}>
              <RelatoriosPage />
            </Suspense>
          }
        />
        <Route path="/alertas" element={<AlertasPage />} />
        <Route path="/membros" element={<MembrosPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
