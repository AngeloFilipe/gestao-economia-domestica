/**
 * Árvore de categorias-modelo, transcrita da "Planilha de Orçamento Familiar"
 * anexa ao documento do MINFIN/AGT (Grupo > Subcategoria > Rubrica).
 * Semeada com familiaId = NULL: é partilhada por todas as famílias e cada
 * uma pode ainda adicionar as suas próprias categorias por cima desta base.
 */

export interface NoArvoreCategoria {
  nome: string;
  filhos?: Array<string | { nome: string; filhos: string[] }>;
}

export interface GrupoCategoria {
  nome: string;
  tipo: "RECEITA" | "DESPESA";
  filhos: Array<string | { nome: string; filhos: string[] }>;
}

export const ARVORE_CATEGORIAS_MINFIN: GrupoCategoria[] = [
  {
    nome: "Receitas",
    tipo: "RECEITA",
    filhos: ["Salário Base", "Remuneração Acessória", "Outra"],
  },
  {
    nome: "Despesas Fixas",
    tipo: "DESPESA",
    filhos: [
      {
        nome: "Habitação",
        filhos: [
          "Arrendamento",
          "Condomínio",
          "Prestação da Casa",
          "Seguro da Casa",
          "Empregados",
          "Combustível Gerador",
        ],
      },
      { nome: "Transporte", filhos: ["Prestação do Carro", "Seguro do Carro"] },
      { nome: "Educação", filhos: ["Creche", "Colégio", "Faculdade", "Curso"] },
    ],
  },
  {
    nome: "Despesas Variáveis",
    tipo: "DESPESA",
    filhos: [
      {
        nome: "Habitação",
        filhos: ["Luz", "Água", "Telefone", "Telemóvel", "Mensalidade TV", "Internet"],
      },
      { nome: "Impostos", filhos: ["IPU", "Taxa de Circulação"] },
      { nome: "Transporte", filhos: ["Taxi", "Barco", "Combustível", "Estacionamento"] },
      { nome: "Alimentação", filhos: ["Supermercado", "Praça", "Padaria", "Peixe/Carne"] },
      {
        nome: "Cuidados Pessoais",
        filhos: ["Cabelereiro", "Manicure/Pedicure", "Esteticista", "Ginásio/Natação"],
      },
    ],
  },
  {
    nome: "Extra",
    tipo: "DESPESA",
    filhos: [
      { nome: "Saúde", filhos: ["Médico", "Dentista", "Hospital", "Medicamentos"] },
      { nome: "Manutenção/Prevenção", filhos: ["Carro", "Casa"] },
      { nome: "Educação", filhos: ["Material Escolar", "Uniforme"] },
    ],
  },
  {
    nome: "Adicionais",
    tipo: "DESPESA",
    filhos: [
      { nome: "Lazer", filhos: ["Viagens", "Cinema/Teatro", "Restaurantes/Bares/Discoteca"] },
      { nome: "Vestuário", filhos: ["Roupas", "Calçados", "Acessórios"] },
      { nome: "Outros", filhos: ["Presentes", "Mesada 1", "Mesada 2"] },
    ],
  },
];
