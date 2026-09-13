import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { ARVORE_CATEGORIAS_MINFIN } from "./categorias-minfin.js";

const prisma = new PrismaClient();

async function semearCategoriasGlobais() {
  const existentes = await prisma.categoria.count({ where: { familiaId: null } });
  if (existentes > 0) {
    console.log(`Categorias globais já existem (${existentes}) — a saltar.`);
    return;
  }

  let ordemGrupo = 0;
  for (const grupo of ARVORE_CATEGORIAS_MINFIN) {
    const grupoCriado = await prisma.categoria.create({
      data: {
        nome: grupo.nome,
        nivel: "GRUPO",
        tipo: grupo.tipo,
        ordem: ordemGrupo++,
        familiaId: null,
      },
    });

    let ordemFilho = 0;
    for (const filho of grupo.filhos) {
      if (typeof filho === "string") {
        // Grupo com rubricas diretas (ex.: Receitas).
        await prisma.categoria.create({
          data: {
            nome: filho,
            nivel: "RUBRICA",
            tipo: grupo.tipo,
            ordem: ordemFilho++,
            parentId: grupoCriado.id,
            familiaId: null,
          },
        });
        continue;
      }

      const subcategoriaCriada = await prisma.categoria.create({
        data: {
          nome: filho.nome,
          nivel: "SUBCATEGORIA",
          tipo: grupo.tipo,
          ordem: ordemFilho++,
          parentId: grupoCriado.id,
          familiaId: null,
        },
      });

      let ordemRubrica = 0;
      for (const rubricaNome of filho.filhos) {
        await prisma.categoria.create({
          data: {
            nome: rubricaNome,
            nivel: "RUBRICA",
            tipo: grupo.tipo,
            ordem: ordemRubrica++,
            parentId: subcategoriaCriada.id,
            familiaId: null,
          },
        });
      }
    }
  }

  const total = await prisma.categoria.count({ where: { familiaId: null } });
  console.log(`Semeadas ${total} categorias globais (modelo MINFIN).`);
}

async function semearFamiliaDemo() {
  const emailAdmin = "ana@familia.demo";
  const existente = await prisma.utilizador.findUnique({ where: { email: emailAdmin } });
  if (existente) {
    console.log("Família de demonstração já existe — a saltar.");
    return;
  }

  const familia = await prisma.familia.create({
    data: { nome: "Família Demo", moeda: "AOA" },
  });

  const passwordHash = await argon2.hash("Demo1234!");

  const admin = await prisma.utilizador.create({
    data: {
      familiaId: familia.id,
      nome: "Ana",
      email: emailAdmin,
      passwordHash,
      papel: "ADMIN",
    },
  });

  await prisma.utilizador.create({
    data: {
      familiaId: familia.id,
      nome: "Bruno",
      email: "bruno@familia.demo",
      passwordHash: await argon2.hash("Demo1234!"),
      papel: "MEMBRO",
    },
  });

  // Orçamento mensal de demonstração, com algumas linhas planeadas.
  const hoje = new Date();
  const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
  const referencia = `${dataInicio.getFullYear()}-${String(dataInicio.getMonth() + 1).padStart(2, "0")}`;

  const periodo = await prisma.periodoOrcamento.create({
    data: {
      familiaId: familia.id,
      tipo: "MENSAL",
      referencia,
      dataInicio,
      dataFim,
      estado: "ATIVO",
      criadoPorId: admin.id,
    },
  });

  async function categoriaPorNome(nome: string) {
    const categoria = await prisma.categoria.findFirst({ where: { nome, familiaId: null } });
    if (!categoria) throw new Error(`Categoria semente não encontrada: ${nome}`);
    return categoria;
  }

  const linhasDemo: Array<[string, number]> = [
    ["Salário Base", 350000],
    ["Arrendamento", 90000],
    ["Luz", 12000],
    ["Água", 6000],
    ["Supermercado", 60000],
    ["Combustível", 20000],
    ["Restaurantes/Bares/Discoteca", 15000],
  ];

  const linhasCriadas = new Map<string, string>();
  for (const [nomeCategoria, valorPlaneado] of linhasDemo) {
    const categoria = await categoriaPorNome(nomeCategoria);
    const linha = await prisma.linhaOrcamentada.create({
      data: { periodoOrcamentoId: periodo.id, categoriaId: categoria.id, valorPlaneado },
    });
    linhasCriadas.set(nomeCategoria, linha.id);
  }

  // Alguns movimentos: previstos (ligados a uma linha) e não previstos.
  const supermercado = await categoriaPorNome("Supermercado");
  await prisma.movimento.create({
    data: {
      familiaId: familia.id,
      data: new Date(),
      valor: 25000,
      tipo: "DESPESA",
      categoriaId: supermercado.id,
      linhaOrcamentadaId: linhasCriadas.get("Supermercado"),
      descricao: "Compras do mês",
      metodoPagamento: "MULTICAIXA",
      registadoPorId: admin.id,
    },
  });

  const presentes = await categoriaPorNome("Presentes");
  await prisma.movimento.create({
    data: {
      familiaId: familia.id,
      data: new Date(),
      valor: 8000,
      tipo: "DESPESA",
      categoriaId: presentes.id,
      linhaOrcamentadaId: null, // não prevista
      descricao: "Prenda de aniversário",
      metodoPagamento: "DINHEIRO",
      registadoPorId: admin.id,
    },
  });

  console.log(`Família de demonstração criada (${emailAdmin} / Demo1234!).`);
}

async function main() {
  await semearCategoriasGlobais();
  await semearFamiliaDemo();
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
