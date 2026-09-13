import { Suspense, lazy, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { GestorLayout } from "./components/GestorLayout";
import { LoginPage } from "./pages/LoginPage";
import { GestorLoginPage } from "./pages/GestorLoginPage";
import { GestorAgregadosPage } from "./pages/GestorAgregadosPage";
import { GestorGestoresPage } from "./pages/GestorGestoresPage";
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

function paginaInicialDe(papel: string | undefined) {
  return papel === "GESTOR" ? "/gestor/agregados" : "/orcamento";
}

function RotaProtegida({ children }: { children: ReactNode }) {
  const { utilizador, carregando } = useAuth();
  if (carregando) return <EcraCarregamento />;
  if (!utilizador) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RotaPublica({ children }: { children: ReactNode }) {
  const { utilizador, carregando } = useAuth();
  if (carregando) return <EcraCarregamento />;
  if (utilizador) return <Navigate to={paginaInicialDe(utilizador.papel)} replace />;
  return <>{children}</>;
}

/** O gestor da aplicação não pertence a nenhum agregado — tem a sua própria
 * área, separada do resto da app (que assume sempre um agregado). */
function AreaAutenticada() {
  const { utilizador } = useAuth();

  if (utilizador?.papel === "GESTOR") {
    return (
      <Routes>
        <Route element={<GestorLayout />}>
          <Route index element={<Navigate to="/gestor/agregados" replace />} />
          <Route path="/gestor/agregados" element={<GestorAgregadosPage />} />
          <Route path="/gestor/gestores" element={<GestorGestoresPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/gestor/agregados" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
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
      <Route path="*" element={<Navigate to="/orcamento" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<RotaPublica><LoginPage /></RotaPublica>} />
      <Route path="/gestor/entrar" element={<RotaPublica><GestorLoginPage /></RotaPublica>} />
      <Route
        path="/*"
        element={
          <RotaProtegida>
            <AreaAutenticada />
          </RotaProtegida>
        }
      />
    </Routes>
  );
}
