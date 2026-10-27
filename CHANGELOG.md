# Changelog & Registro de Decisões — EcoGuard

**Projeto:** EcoGuard — Sistema de Monitoramento e Registro de Ocorrências Ambientais  
**Instituição:** Instituto Federal de Rondônia (IFRO) — Campus Porto Velho Calama  
**Disciplina:** Programar com IA de forma responsável  
**Professor:** Rafael Pitwak  

Este documento registra o histórico cronológico de versões, decisões técnicas de arquitetura, correções realizadas e as revisões críticas humanas efetuadas sobre as propostas geradas pelos agentes de IA (Google Antigravity), demonstrando desenvolvimento consciente, responsável e auditado.

---

## [Fase 3 — Versão 1.2.0] - 27/10/2026: Preparação para Publicação e Entrega Final

### Adicionado
- **Script SQL Completo (`database/schema.sql`):** Criação formal de DDL para criação das tabelas `usuarios`, `ocorrencias` e `historico_atendimento`, com índices de busca e *seeds* realistas de Porto Velho.
- **Configuração de Variáveis de Ambiente (`.env.example`):** Modelo de configuração sem expor segredos no repositório (`PORT`, `NODE_ENV`, `DB_PATH`, `SESSION_SECRET`).
- **Arquivos de Compatibilidade de Deploy:**
  - `render.yaml`: Configuração *Infrastructure as Code* para deploy gratuito com 1 clique no Render.
  - `vercel.json` e `api/index.js`: Adaptador *serverless* para publicação opcional na Vercel.
- **Seção "Instalação e Execução" no `spec.md`:** Guia detalhado passo a passo cobrindo ambiente, banco, variáveis, roteiro de testes e limitações conhecidas.

### Segurança e Auditoria (Anexo B da Apostila)
- Revisão do `.gitignore` garantindo que arquivos `.env` reais, logs e chaves locais nunca sejam enviados ao GitHub.
- Configuração do servidor Express (`src/server.js`) para ler portas dinâmicas via `process.env.PORT` e caminhos customizados de banco de dados via `process.env.DB_PATH`.
- Modularização do `server.js` permitindo exportação limpa do app para ambientes *serverless* sem conflito de portas.

---

## [Fase 2 — Versão 1.1.0] - 20/10/2026: Implementação do Sistema e Testes Automatizados

### Revisões Humanas Críticas sobre as Propostas da IA
1. **Criptografia de Senhas (RNF01):**
   - *Proposta da IA:* Utilização de hash simples ou dependências de terceiros nativas que poderiam falhar na compilação em computadores de laboratório Windows sem Python/C++ build tools.
   - *Decisão/Revisão Humana:* Determinada a implementação com o módulo nativo `crypto` do Node.js utilizando **PBKDF2 com 100.000 iterações, salt aleatório de 16 bytes e SHA-512**, acompanhado de comparação com tempo constante (`crypto.timingSafeEqual`) para prevenir ataques de *timing*.
2. **Contextualização Territorial com Porto Velho:**
   - *Proposta da IA:* Usar bairros e categorias genéricas (ex.: "Centro", "Bairro A", "Poluição Geral").
   - *Decisão/Revisão Humana:* Customização detalhada para a realidade ambiental de Rondônia: focos de queimada urbana (período de estiagem amazônica), descarte de pneus na orla do Rio Madeira (bairro Panair), despejo de efluentes no Igarapé dos Tanques (bairro Nacional) e supressão de castanheiras (Nova Porto Velho).
3. **Auditoria e Linha do Tempo Imutável (RNF05):**
   - *Proposta da IA:* Apenas sobrescrever o campo `status` na tabela de ocorrências.
   - *Decisão/Revisão Humana:* Exigida a criação de uma terceira tabela relacional (`historico_atendimento`), conectada por chave estrangeira, registrando quem alterou o status, a justificativa/despacho e data/hora para auditoria pública.

### Adicionado
- Backend completo em Express com rotas REST (`/api/auth/*`, `/api/ocorrencias/*`, `/api/stats`).
- Banco relacional SQLite local com `PRAGMA foreign_keys = ON`.
- Interface gráfica SPA em HTML5/CSS3/JS Vanilla com mapa interativo Leaflet.js e gráficos Chart.js.
- Bateria de testes automatizados (`test/api_test.js`) validando os 6 requisitos principais com 100% de cobertura de sucesso.

---

## [Fase 1 — Versão 1.0.0] - 20/10/2026: Planejamento e Especificação Técnica Inicial

### Adicionado
- Criação do documento `spec.md` estruturado com as 8 seções obrigatórias da rubrica avaliativa do IFRO:
  - 1. Objetivo
  - 2. Usuários (Cidadão, Fiscal Ambiental, Administrador)
  - 3. Casos de Uso Principais (UC01 a UC07)
  - 4. Requisitos Funcionais (RF01 a RF07)
  - 5. Requisitos Não Funcionais (RNF01 a RNF05)
  - 6. Modelo de Dados Relacional (DER simples com Mermaid)
  - 7. Critérios de Aceite no padrão BDD (*Dado que..., Quando..., Então...*)
  - 8. Decisão de Stack e Deploy (Node.js + Express + SQLite)
- Criação do repositório no GitHub: `https://github.com/souzakauanny82-debug/EcoGuard.git`.
