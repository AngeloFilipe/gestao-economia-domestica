const INICIO_MARCAS_DIACRITICAS = 0x0300;
const FIM_MARCAS_DIACRITICAS = 0x036f;

/**
 * Normaliza o nome de um agregado para a chave de login: maiúsculas, sem
 * acentos, espaços internos colapsados. Aplicado sempre que um agregado é
 * criado (gestor ou seed) e sempre que se tenta iniciar sessão, para que
 * "Família Costa", "familia costa" e "FAMÍLIA COSTA" sejam todos o mesmo
 * agregado aos olhos do login.
 *
 * Percorre os pontos de código em vez de usar uma classe de regex com
 * caracteres combinantes literais, para não haver ambiguidade nenhuma sobre
 * que bytes ficam gravados neste ficheiro.
 */
export function normalizarCodigoLogin(nome: string): string {
  let semAcentos = "";
  for (const caractere of nome.normalize("NFD")) {
    const codigo = caractere.codePointAt(0)!;
    if (codigo >= INICIO_MARCAS_DIACRITICAS && codigo <= FIM_MARCAS_DIACRITICAS) continue;
    semAcentos += caractere;
  }
  return semAcentos.trim().replace(/\s+/g, " ").toUpperCase();
}
