# Análise de Sustentabilidade Anual - SII4 (2026-2027+)

## 1. Visão Geral da Estratégia de Transição
O sistema SII4 foi implementado em Janeiro de 2026 com uma estratégia "híbrida" para lidar com o histórico:
- **Stock 2025 (Backlog)**: Representa o volume de processos pendentes herdados do sistema anterior ou processos físicos. Estes são geridos "manualmente" (registados apenas na tabela `inqueritos`).
- **Fluxo Oficial 2026 (SP)**: Representa o novo fluxo de trabalho onde todos os processos são primeiro registados na Secretaria (SP) e depois distribuídos.

---

## 2. Análise da Lógica de Cálculo (Movimentação)

### 2.1 Sustentabilidade do Cálculo de Stock
A lógica implementada no sistema (especialmente em `fetchMonthlyReportStats` e `getYearProgress`) baseia-se na fórmula fundamental de stock:
> **Stock Final = Stock Inicial + Entradas - Saídas**

Esta abordagem é **sustentável** por vários motivos:
1. **Ponto de Basal (Stock Inicial)**: O sistema permite configurar um valor fixo no início de cada ano (ex: 539 para 2025). Isto permite "selar" o passado e focar no futuro.
2. **Separação de Origens**: O sistema consegue distinguir entre o que é "Novo" (registado na SP em 2026) e o que é "Backlog" (registado apenas via utilizador).
3. **Mecanismo de Fallback**: Caso um administrador esqueça de configurar o stock do novo ano, o sistema tem uma lógica de "Carryover Automático" que calcula o saldo do ano anterior (`Stock Inicial + total_entradas - total_saidas`).

### 2.2 Repeatabilidade para 2027
Para o ano de 2027, o sistema será **totalmente auto-suficiente**:
- O "Stock Inicial 2027" será o saldo final de 2026.
- Como todos os processos de 2026 já entraram via SP (Oficial), a distinção entre "Manual" e "Oficial" deixará de ser uma preocupação operacional, embora a lógica continue a funcionar para casos residuais.
- As tabelas de configuração (`sp_config_years`) e as tabelas operacionais (`sp_processos_crime`) estão preparadas para crescer ano após ano sem conflitos.

---

## 3. Conformidade com os Requisitos Operacionais

O sistema responde perfeitamente à necessidade de "abater" o stock de 2025:
- **Abate Automático**: Quando um utilizador conclui um inquérito que não existe no "registo oficial da SP", o sistema detecta-o como "Manual" e reduz automaticamente o stock herdado de 2025.
- **Novos Processos**: Processos criados via SP aparecem como novas entradas no ano corrente. A conclusão destes processos abate na conta de "Concluídos Oficiais", mantendo a estatística separada e limpa.

---

## 4. Conclusões e Recomendações

### Conclusões:
1. **Design Robusto**: A decisão de usar `NUIPC` como chave de ligação e verificar a presença nas tabelas da SP permite uma distinção clara entre o fluxo novo e o antigo sem necessidade de flags extra.
2. **Independência de Datas**: O sistema não se limita apenas ao ano civil para os abates de stock, permitindo que processos de 2025 concluídos em 2026 ainda contem para a redução do backlog.
3. **Escalabilidade**: A estrutura está pronta para 2027, 2028 e seguintes, bastando apenas "Abrir o Novo Ano" no menu de configurações.

### Recomendações:
- **Abertura de Ano**: Recomenda-se que a abertura do ano 2027 seja feita na primeira semana de Janeiro para garantir que a numeração sequencial (1..N) da SP comece correctamente do zero.
- **Limpeza de Backlog**: À medida que o stock de 2025 se aproxima de zero, o sistema tornar-se-á puramente oficial, o que aumentará a fiabilidade dos dados estatísticos.
- **Fecho de Ano**: Implementar no futuro uma função de "Congelar Ano" para evitar que edições em processos de anos muito antigos alterem os relatórios históricos já emitidos.

**O sistema está pronto e robusto para operar de forma repetível e sustentável.**

---
*Análise realizada em 2026-01-06*
