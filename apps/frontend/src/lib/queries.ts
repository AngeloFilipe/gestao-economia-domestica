import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AgregadoDTO,
  AlertaDTO,
  CategoriaDTO,
  ConvidarMembroInput,
  CriarAgregadoInput,
  CriarMovimentoInput,
  CriarOrcamentoInput,
  EstadoPeriodo,
  LinhaOrcamentadaInput,
  MovimentoDTO,
  OrcadoRealizadoRelatorioDTO,
  PeriodoOrcamentoDTO,
  Regra555ResultadoDTO,
  SaldoMensalPontoDTO,
  UtilizadorPublico,
} from "@ged/shared";
import { api } from "./api";

export function useCategorias() {
  return useQuery({ queryKey: ["categorias"], queryFn: () => api.get<CategoriaDTO[]>("/categorias") });
}

export function usePeriodos() {
  return useQuery({ queryKey: ["periodos"], queryFn: () => api.get<PeriodoOrcamentoDTO[]>("/orcamento") });
}

export function usePeriodo(id: string | undefined) {
  return useQuery({
    queryKey: ["periodos", id],
    queryFn: () => api.get<PeriodoOrcamentoDTO>(`/orcamento/${id}`),
    enabled: !!id,
  });
}

export function useCriarOrcamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarOrcamentoInput) => api.post<PeriodoOrcamentoDTO>("/orcamento", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["periodos"] }),
  });
}

export function useDefinirLinha(periodoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LinhaOrcamentadaInput) =>
      api.put<PeriodoOrcamentoDTO>(`/orcamento/${periodoId}/linhas`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periodos"] });
      queryClient.invalidateQueries({ queryKey: ["orcado-realizado", periodoId] });
      queryClient.invalidateQueries({ queryKey: ["regra-555", periodoId] });
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
    },
  });
}

export function useAtualizarEstadoPeriodo(periodoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (estado: EstadoPeriodo) =>
      api.patch<PeriodoOrcamentoDTO>(`/orcamento/${periodoId}/estado`, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periodos"] });
      queryClient.invalidateQueries({ queryKey: ["periodos", periodoId] });
    },
  });
}

export function useMovimentos(filtro: Record<string, string | boolean | undefined> = {}) {
  const query = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtro)) {
    if (valor !== undefined && valor !== "") query.set(chave, String(valor));
  }
  const sufixo = query.toString() ? `?${query.toString()}` : "";
  return useQuery({
    queryKey: ["movimentos", filtro],
    queryFn: () => api.get<MovimentoDTO[]>(`/movimentos${sufixo}`),
  });
}

export function useCriarMovimento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarMovimentoInput) => api.post<MovimentoDTO>("/movimentos", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movimentos"] });
      queryClient.invalidateQueries({ queryKey: ["orcado-realizado"] });
      queryClient.invalidateQueries({ queryKey: ["saldo-mensal"] });
      queryClient.invalidateQueries({ queryKey: ["regra-555"] });
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
    },
  });
}

export function useRemoverMovimento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/movimentos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movimentos"] });
      queryClient.invalidateQueries({ queryKey: ["orcado-realizado"] });
      queryClient.invalidateQueries({ queryKey: ["saldo-mensal"] });
      queryClient.invalidateQueries({ queryKey: ["regra-555"] });
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
    },
  });
}

export function useOrcadoRealizado(periodoId: string | undefined) {
  return useQuery({
    queryKey: ["orcado-realizado", periodoId],
    queryFn: () => api.get<OrcadoRealizadoRelatorioDTO>(`/relatorios/orcado-realizado/${periodoId}`),
    enabled: !!periodoId,
  });
}

export function useSaldoMensal(meses = 12) {
  return useQuery({
    queryKey: ["saldo-mensal", meses],
    queryFn: () => api.get<SaldoMensalPontoDTO[]>(`/relatorios/saldo-mensal?meses=${meses}`),
  });
}

export function useRegra555(periodoId: string | undefined) {
  return useQuery({
    queryKey: ["regra-555", periodoId],
    queryFn: () => api.get<Regra555ResultadoDTO>(`/relatorios/regra-555/${periodoId}`),
    enabled: !!periodoId,
  });
}

export function useAlertas(apenasNaoLidos = false) {
  return useQuery({
    queryKey: ["alertas", apenasNaoLidos],
    queryFn: () => api.get<AlertaDTO[]>(`/alertas${apenasNaoLidos ? "?apenasNaoLidos=true" : ""}`),
    refetchInterval: 60_000,
  });
}

export function useAgregados() {
  return useQuery({ queryKey: ["agregados"], queryFn: () => api.get<AgregadoDTO[]>("/auth/gestor/agregados") });
}

export function useCriarAgregado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarAgregadoInput) => api.post<AgregadoDTO>("/auth/gestor/agregados", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agregados"] }),
  });
}

export function useMembros() {
  return useQuery({ queryKey: ["membros"], queryFn: () => api.get<UtilizadorPublico[]>("/auth/membros") });
}

export function useConvidarMembro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConvidarMembroInput) => api.post<UtilizadorPublico>("/auth/membros", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["membros"] }),
  });
}

export function useMarcarAlertaLido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/alertas/${id}/lido`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alertas"] }),
  });
}
