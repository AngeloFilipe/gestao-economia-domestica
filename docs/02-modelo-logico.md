# Modelo lógico

Tradução do modelo conceptual (`01-modelo-conceptual.md`) para um esquema relacional
normalizado (3ª Forma Normal), independente do SGBD concreto. A implementação física
real em SQLite/Prisma está em `03-modelo-fisico.md` — este documento descreve a forma
"canónica" do esquema, tal como se aplicaria a qualquer SGBD relacional.

## Convenções

- Todas as tabelas têm uma chave primária `id` (identificador opaco, gerado pela
  aplicação — `cuid()`), em vez de uma chave natural, porque nenhuma das entidades tem
  um atributo natural estável (nomes de categoria repetem-se entre famílias, emails
  podem mudar, etc.).
- Nomes de tabela em `snake_case` plural; nomes de coluna em `camelCase`, espelhando
  os nomes do modelo conceptual para que a rastreabilidade entre os três documentos
  seja imediata.
- `FK` = chave estrangeira. `UK` = chave única. `NN` = not null.

## Tabelas

### familias
| Coluna | Tipo | Notas |
|---|---|---|
| id | string | PK |
| nome | string | NN — nome de exibição do agregado |
| codigoLogin | string | UK, NN — `nome` normalizado (maiúsculas, sem acentos), usado para identificar o agregado no login |
| moeda | string | NN, omissão `"AOA"` |
| criadoEm | datetime | NN |

### utilizadores
| Coluna | Tipo | Notas |
|---|---|---|
| id | string | PK |
| familiaId | string | FK → familias.id, **nullable** (NULL apenas para papel `GESTOR`) |
| nome | string | NN |
| email | string | UK, NN — único em toda a aplicação, não só dentro do agregado |
| passwordHash | string | NN — nunca a password em claro |
| papel | string | NN, `GESTOR`\|`ADMIN`\|`MEMBRO` |
| ativo | boolean | NN, omissão `true` |
| criadoEm | datetime | NN |

*Nota sobre o ciclo de vida das contas:* o primeiro `GESTOR` nasce a partir de
variáveis de ambiente no arranque do servidor (ver `03-modelo-fisico.md`); qualquer
`GESTOR` pode depois cadastrar mais gestores. Um `ADMIN` (rótulo na interface: "Gestor
do Agregado") **auto-regista-se livremente** em `POST /api/auth/registar` — cria o seu
próprio agregado e não depende de nenhum `GESTOR`; um `GESTOR` também pode criar um
`ADMIN` manualmente (`POST /api/auth/gestor/agregados`) como via alternativa de
suporte. Um `MEMBRO` (ou outro `ADMIN`) só nasce quando um `ADMIN` do agregado o
cadastra — não há auto-registo para estes.

### refresh_tokens
| Coluna | Tipo | Notas |
|---|---|---|
| id | string | PK |
| utilizadorId | string | FK → utilizadores.id, NN, ON DELETE CASCADE |
| tokenHash | string | UK, NN — só o hash SHA-256 é guardado |
| expiraEm | datetime | NN |
| revogadoEm | datetime | nullable |

### categorias
| Coluna | Tipo | Notas |
|---|---|---|
| id | string | PK |
| familiaId | string | FK → familias.id, **nullable** (NULL = categoria global) |
| parentId | string | FK → categorias.id (auto-referência), nullable |
| nome | string | NN |
| nivel | string | NN, `GRUPO`\|`SUBCATEGORIA`\|`RUBRICA` |
| tipo | string | NN, `RECEITA`\|`DESPESA` |
| ordem | int | NN, omissão 0 — ordem de visualização |
| ativo | boolean | NN, omissão `true` — soft-delete |

*Normalização:* o nome da categoria-pai nunca é duplicado numa coluna de texto na
categoria-filha — obtém-se sempre por junção via `parentId`, eliminando anomalias de
atualização (mudar o nome de "Despesas Fixas" só exige um UPDATE, nunca N).

### periodos_orcamento
| Coluna | Tipo | Notas |
|---|---|---|
| id | string | PK |
| familiaId | string | FK → familias.id, NN |
| tipo | string | NN, `MENSAL`\|`TRIMESTRAL`\|`SEMESTRAL`\|`ANUAL` |
| referencia | string | NN, ex. `"2026-01"`, `"2026-T1"` |
| dataInicio | date | NN |
| dataFim | date | NN |
| estado | string | NN, `RASCUNHO`\|`ATIVO`\|`FECHADO` |
| criadoPorId | string | FK → utilizadores.id, NN |
| criadoEm | datetime | NN |

**UK** (familiaId, tipo, referencia) — uma família não pode ter dois orçamentos
mensais para "2026-01", por exemplo.

### linhas_orcamentadas
| Coluna | Tipo | Notas |
|---|---|---|
| id | string | PK |
| periodoOrcamentoId | string | FK → periodos_orcamento.id, NN, ON DELETE CASCADE |
| categoriaId | string | FK → categorias.id, NN (deve ser nível RUBRICA) |
| valorPlaneado | decimal | NN, ≥ 0 |
| observacoes | string | nullable |

**UK** (periodoOrcamentoId, categoriaId) — o valor planeado é único por rubrica e por
período (é exatamente uma célula da planilha-modelo do MINFIN).

### movimentos
| Coluna | Tipo | Notas |
|---|---|---|
| id | string | PK |
| familiaId | string | FK → familias.id, NN |
| data | date | NN |
| valor | decimal | NN, > 0 |
| tipo | string | NN, `RECEITA`\|`DESPESA` |
| categoriaId | string | FK → categorias.id, NN |
| linhaOrcamentadaId | string | FK → linhas_orcamentadas.id, **nullable**, ON DELETE SET NULL |
| descricao | string | nullable |
| metodoPagamento | string | nullable |
| registadoPorId | string | FK → utilizadores.id, NN |
| criadoEm | datetime | NN |

*Normalização/desenho:* propositadamente **sem** `periodoOrcamentoId` — ver
`01-modelo-conceptual.md`, secção Movimento, para a justificação (evitar duplicar a
pertença a período, que se resolve por intervalo de datas em tempo de consulta).
`ON DELETE SET NULL` em `linhaOrcamentadaId`: apagar uma linha orçamentada nunca
apaga o histórico de despesa real, apenas desliga-o do plano (passa a "não prevista").

### regras_alerta
| Coluna | Tipo | Notas |
|---|---|---|
| id | string | PK |
| familiaId | string | FK → familias.id, NN |
| ambito | string | NN, `CATEGORIA`\|`GRUPO`\|`ORCAMENTO_GLOBAL` |
| categoriaId | string | FK → categorias.id, nullable (obrigatório só quando ambito ≠ ORCAMENTO_GLOBAL) |
| limiarAvisoPct | float | NN, omissão 80 |
| limiarCriticoPct | float | NN, omissão 100 |
| ativo | boolean | NN, omissão `true` |

### alertas
| Coluna | Tipo | Notas |
|---|---|---|
| id | string | PK |
| familiaId | string | FK → familias.id, NN |
| periodoOrcamentoId | string | FK → periodos_orcamento.id, NN, ON DELETE CASCADE |
| categoriaId | string | FK → categorias.id, nullable (NULL = alerta do orçamento global do período) |
| nivel | string | NN, `AVISO`\|`CRITICO`\|`RISCO_RUTURA` |
| mensagem | string | NN |
| valorReferencia | float | nullable — percentagem consumida, ou saldo projetado |
| criadoEm | datetime | NN |
| lidoEm | datetime | nullable |
| lidoPorId | string | FK → utilizadores.id, nullable |

*Nota sobre deduplicação:* não existe uma UK (periodoOrcamentoId, categoriaId, nivel)
neste modelo lógico apesar de parecer a escolha óbvia — a razão é específica do SQL
usado no SGBD escolhido (SQLite trata cada NULL como distinto num índice único, o que
quebraria a deduplicação exatamente no caso `categoriaId = NULL` dos alertas de
âmbito global). Ver `03-modelo-fisico.md` para a alternativa adotada.
