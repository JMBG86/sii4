Ponto de Situação - SII4
Data: 08 de Dezembro de 2025

1. Visão Geral e Objetivo
O SII4 é um Sistema Integrado de Inquéritos desenvolvido para otimizar o fluxo de trabalho de investigação criminal (GNR/Albufeira). O sistema gere inquéritos, diligências, prazos, ofícios e produz relatórios estatísticos automáticos.

Stack Tecnológica
Framework: Next.js 14 (App Router)
Base de Dados & Auth: Supabase (PostgreSQL)
UI/UX: ShadcnUI + TailwindCSS (Design "Premium", Dark Mode)
Relatórios:
jspdf + jspdf-autotable (PDFs)
docxtemplater + pizzip (Word Templates)
recharts (Gráficos)
2. Estrutura do Projeto (Ficheiros Chave)
Esta lista destaca onde estão as lógicas mais importantes criadas recentemente:

Relatórios e Exportações
src/lib/pdf-generator.ts
: "Cérebro" dos PDFs. Contém:
generateWeeklyProductivityReport
: Relatório semanal com listagens por militar.
generateDashboardReport
: Relatório "Estado da Nação" (Landscape) com tabelas semanais/mensais.
src/lib/docx-service.ts
: Utilitário para preencher templates Word (.docx).
src/components/inquiry/export-template-button.tsx
: Botão "Imprimir capa do processo" que usa o docx-service.
public/templates/: Diretoria onde OBRIGATORIAMENTE deve estar o ficheiro capa.docx.
Admin & Estado da Nação (EdN)
src/app/admin/edn/page.tsx: Dashboard principal de estatísticas.
src/app/admin/edn/weekly-report-dialog.tsx: Janela de seleção de semanas (Sexta a Sexta) para relatórios.
Inquéritos
src/app/inqueritos/[id]/page.tsx: Página de detalhe. Recentemente alterada para incluir:
Botão de Apagar (DeleteInquiryButton).
Visualização do Nº Ofício de Saída (numero_oficio).
3. Realizações da Última Sessão
Focámos num grande upgrade de Produtividade e Reporting:

Relatório Semanal de Produtividade:

Implementado cálculo automático de semanas (Sexta 09:00 - Sexta 09:00).
PDF com contagem de processos e lista detalhada por militar.
Badges de carga de trabalho (Baixa a Excesso Detectado).
Capa do Processo (Word):

Mudança de PDF estático para Template Word editável.
Tags funcionais: {nuipc}, {crime}, {ocorrencia}, {autuacao}, {registo}, {denunciantes}, {denunciados}.
Dashboard Completo (PDF):

Exportação de toda a vista "Estado da Nação" para PDF Horizontal.
UX/UI Improvements:

Botão de eliminar com confirmação de segurança.
Destaque visual do Nº de Ofício nos processos concluídos.
4. Constraint Importante (Ambiente)
IMPORTANT

PowerShell: Ao fazer deploy/git, usar sempre comandos sequenciais (git add ...; git commit ...; git push), nunca encadeados com &&. Isto já está documentado no task.md.

5. Próximos Passos Sugeridos
Ao retomar o trabalho, consultar o task.md para itens pendentes menores ou iniciar novas funcionalidades como:

Refinamento das Notificações em Tempo Real.
Gestão avançada de Utilizadores (Admin).
Criação de mais templates de Ofícios.
Este documento serve de guia para retomar o raciocínio instantaneamente. Bom descanso!