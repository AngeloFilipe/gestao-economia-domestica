import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { LoginGestorInput, LoginInput, RegistarAgregadoInput, SessaoResposta, UtilizadorPublico } from "@ged/shared";
import { api, definirAccessToken, renovarSessao } from "../lib/api";

interface AuthContextValor {
  utilizador: UtilizadorPublico | null;
  carregando: boolean;
  entrar: (input: LoginInput) => Promise<void>;
  entrarComoGestor: (input: LoginGestorInput) => Promise<void>;
  registar: (input: RegistarAgregadoInput) => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilizador, setUtilizador] = useState<UtilizadorPublico | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const sessao = await renovarSessao();
      if (!ativo) return;
      setUtilizador(sessao?.utilizador ?? null);
      if (!sessao) definirAccessToken(null);
      setCarregando(false);
    })();
    return () => {
      ativo = false;
    };
  }, []);

  async function entrar(input: LoginInput) {
    const resposta = await api.post<SessaoResposta>("/auth/login", input);
    definirAccessToken(resposta.accessToken);
    setUtilizador(resposta.utilizador);
  }

  async function entrarComoGestor(input: LoginGestorInput) {
    const resposta = await api.post<SessaoResposta>("/auth/gestor/login", input);
    definirAccessToken(resposta.accessToken);
    setUtilizador(resposta.utilizador);
  }

  async function registar(input: RegistarAgregadoInput) {
    const resposta = await api.post<SessaoResposta>("/auth/registar", input);
    definirAccessToken(resposta.accessToken);
    setUtilizador(resposta.utilizador);
  }

  async function sair() {
    await api.post("/auth/logout");
    definirAccessToken(null);
    setUtilizador(null);
  }

  return (
    <AuthContext.Provider value={{ utilizador, carregando, entrar, entrarComoGestor, registar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth tem de ser usado dentro de um AuthProvider.");
  return contexto;
}
