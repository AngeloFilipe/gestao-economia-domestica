# Filosofia da aplicação

## Origem

Esta aplicação nasce diretamente do documento da Direcção de Recursos Humanos do
MINFIN/AGT, *"Domina as suas finanças ou as suas finanças o dominam?"*, entregue como
apoio às famílias na gestão da poupança. O documento defende três ideias centrais, e
cada uma delas tem uma tradução direta e deliberada numa funcionalidade da aplicação:

| Ideia do documento MINFIN | Como se traduz na aplicação |
|---|---|
| "O encargo de uma família hoje em dia é semelhante ao de uma microempresa, tem receitas, despesas, e por isso os gastos devem ser bem planeados." | **Domínio 1 — Orçamento**: a família define, antecipadamente, quanto espera receber e quanto pretende gastar por categoria, para um período mensal, trimestral, semestral ou anual — exatamente como uma pequena empresa orça o seu exercício. |
| "Fazer um planeamento financeiro tão logo receba o seu salário, por meio de uma planilha de orçamento doméstico." | A planilha-modelo em anexo ao documento (Habitação, Transporte, Educação, Alimentação, Cuidados Pessoais, Saúde, Lazer, Vestuário…) foi transcrita literalmente para a árvore de categorias da aplicação (ver `docs/01-modelo-conceptual.md`), para que nenhuma família tenha de "inventar" categorias do zero. |
| Distinguir **necessidade** de **desejo**, e evitar decisões de compra por impulso. | **Domínio 2 — Registo diário**: todo o movimento lançado fica automaticamente classificado como *previsto* (ligado a uma linha que a família decidiu com calma, antes do mês começar) ou *não previsto* ("extra"/impulso). Ver a etiqueta "não prevista" nos movimentos e o seu peso nos relatórios torna visível, sem julgamento, o padrão de consumo por impulso que o documento pede para vigiar. |
| "Evitar o consumo excessivo… evitar riscos de rutura orçamental." | **Domínio 3 — Relatórios e alertas**: o motor de alertas (ver `docs/03-modelo-fisico.md`) avisa a família em três níveis — 80% do planeado consumido, 100% consumido, e risco de o período fechar com saldo negativo — antes que a rutura aconteça, não depois. |
| Regra de repartição do rendimento: **55% despesas fixas, 45% outras despesas, mínimo 5% de poupança.** | É a métrica central dos relatórios: cada orçamento e cada período fechado mostram, em tempo real, os três valores contra estas metas (`Regra555Painel` no frontend, `calcularRegra555` no backend). |

## Princípios de desenho que daqui derivam

1. **Nada de categorias em branco.** A app arranca já semeada com a árvore completa do
   MINFIN (`apps/backend/prisma/categorias-minfin.ts`), para que o primeiro obstáculo de
   qualquer ferramenta de orçamento — "por onde começo?" — desapareça.
2. **"Previsto" vs. "não previsto" é uma categoria de primeira classe**, não um detalhe
   técnico: aparece em todos os ecrãs de registo e de relatório, porque é o próprio
   conceito de disciplina financeira que o documento MINFIN pede.
3. **Os alertas são preventivos, não apenas informativos.** Disparam a 80% (aviso) e a
   100% (crítico) do planeado — antes da rutura —, e um alerta adicional de "risco de
   rutura orçamental" projeta o saldo até ao fim do período tendo em conta o que ainda
   falta gastar do planeado, não apenas o que já foi gasto.
4. **Toda a família partilha os mesmos números.** Vários membros podem registar
   movimentos a partir dos seus próprios telemóveis; o orçamento e os alertas são
   sempre os da família, nunca de uma pessoa isolada — reflete a ideia do documento de
   que a gestão financeira é uma responsabilidade partilhada do agregado, não de um
   único indivíduo.
5. **Acessível em qualquer ecrã.** Uma família não faz o seu orçamento sentada a uma
   secretária — faz-se no telemóvel, no minuto a seguir a uma compra. Por isso a
   aplicação é uma PWA responsiva, instalável, e o registo de um movimento cabe em
   poucos toques.

## Fora de âmbito (por agora)

O documento MINFIN também aconselha sobre hábitos gerais de consumo (comparar preços,
listas de compras, ceticismo perante publicidade). Estes são conselhos de
comportamento, não dados a gerir — a aplicação não tenta substituir esse
discernimento, apenas dar à família a visibilidade sobre os números que torna esse
discernimento possível.
