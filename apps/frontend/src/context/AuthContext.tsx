import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { LoginInput, RegistarFamiliaInput, SessaoResposta, UtilizadorPublico } from "@ged/shared";
import { api, definirAccessToken, renovarSessao } from "../lib/api";

interface AuthContextValor {
  utilizador: UtilizadorPublico | null;
  carregando: boolean;
  entrar: (input: LoginInput) => Promise<void>;
  registar: (input: RegistarFamiliaInput) => Promise<void>;
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

  async function registar(input: RegistarFamiliaInput) {
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
    <AuthContext.Provider value={{ utilizador, carregando, entrar, registar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth tem de ser usado dentro de um AuthProvider.");
  return contexto;
}
