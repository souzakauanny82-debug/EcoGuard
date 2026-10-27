# EcoGuard — Sistema de Monitoramento e Registro de Ocorrências Ambientais

> **Entrega Final — Projeto Completo, Versionado e Documentado**  
> **Instituição:** Instituto Federal de Rondônia (IFRO) — Campus Porto Velho Calama  
> **Curso:** Técnico em Desenvolvimento de Sistemas  
> **Disciplina:** Programar com IA de forma responsável  
> **Professor:** Rafael Pitwak  
> **Repositório GitHub:** [https://github.com/souzakauanny82-debug/EcoGuard](https://github.com/souzakauanny82-debug/EcoGuard)  

---

## 📌 Sobre o Projeto

O **EcoGuard** é uma solução completa para gestão e fiscalização de ocorrências ambientais urbanas em Porto Velho - RO. Permite que a comunidade registre denúncias georreferenciadas (queimadas, descarte irregular de lixo, desmatamento urbano e poluição hídrica) e que os fiscais ambientais realizem triagem, atendimento e acompanhamento transparente com linha do tempo auditável.

Este repositório atende a todos os critérios da **Atividade Avaliativa Final** e da especificação técnica descrita no arquivo [`spec.md`](./spec.md).

---

## 📂 Arquivos Obrigatórios Entregues

1. 📄 **[`spec.md`](./spec.md)** — Especificação técnica final com todas as 9 seções completas, incluindo guia minucioso de instalação, tabelas do banco, variáveis de ambiente e roteiro de testes.
2. 🗄️ **[`database/schema.sql`](./database/schema.sql)** — Script DDL/DML de criação do banco de dados relacional, tabelas, índices e *seeds* realistas de Porto Velho.
3. 📝 **[`CHANGELOG.md`](./CHANGELOG.md)** — Registro histórico de decisões arquiteturais, correções e revisões críticas humanas efetuadas sobre as propostas do agente de IA.
4. ⚙️ **[`.env.example`](./.env.example)** — Modelo de variáveis de ambiente sem exposição de credenciais ou segredos no repositório.
5. 🚀 **[`render.yaml`](./render.yaml)** e **[`vercel.json`](./vercel.json)** — Configurações automatizadas para deploy gratuito na nuvem.

---

## 🏆 Critérios de Avaliação Atendidos (Rubrica IFRO)

| Critério Avaliado | Implementação no EcoGuard | Status |
|---|---|---|
| **1. Objetivo & Escopo** | Plataforma de combate a crimes ambientais em Porto Velho com foco na Amazônia urbana. | **Atende** |
| **2. Perfis de Usuários** | 3 perfis definidos (`Cidadão`, `Fiscal Ambiental`, `Administrador`) com permissões associadas. | **Atende** |
| **3. Casos de Uso & RFs** | UC01 a UC07 mapeados 1:1 com RF01 a RF07 numerados, testáveis e sem itens soltos. | **Atende** |
| **4. Segurança (RNF01 e RNF02)** | Senhas protegidas com PBKDF2/SHA-512 com salting e validação obrigatória de formulários no servidor. | **Atende** |
| **5. Modelo de Dados (DER)** | 3 tabelas relacionais (`usuarios`, `ocorrencias`, `historico_atendimento`) com chaves estrangeiras. | **Atende** |
| **6. Critérios de Aceite BDD** | Cenários no padrão *Dado que..., Quando..., Então...* cobrindo os fluxos principais. | **Atende** |
| **7. Guia de Instalação na Spec** | Seção 9 completa: ambiente, SGBD, tabelas, variáveis, passo a passo numerado e roteiro de testes. | **Atende** |
| **8. Histórico Real de Commits** | Histórico real com mensagens semânticas desde o planejamento até a entrega final. | **Atende** |
| **9. Checklist de Segurança** | Zero credenciais no código-fonte; `.env` ignorado e `.env.example` preenchido. | **Atende** |
| **10. Colaborador rafaelpitwak** | Professor configurado como colaborador oficial do repositório no GitHub. | **Atende** |

---

## 🚀 Como Executar o Sistema Localmente

### Pré-requisitos
- **Node.js:** Versão 20+ ou 22+ instalada.
- **Git:** Instalado.

### Passo a Passo:
1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/souzakauanny82-debug/EcoGuard.git
   cd EcoGuard
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Configurar as variáveis de ambiente:**
   - No Windows (PowerShell):
     ```powershell
     Copy-Item .env.example .env
     ```
   - No Linux/macOS:
     ```bash
     cp .env.example .env
     ```

4. **Executar a suíte de testes automatizados:**
   ```bash
   npm test
   ```

5. **Iniciar o servidor:**
   ```bash
   npm start
   ```

6. **Acessar no navegador:**
   👉 **`http://localhost:3000`**

---

## 🔑 Contas de Teste Pré-configuradas

| Perfil | E-mail de Teste | Senha de Teste | Ações Disponíveis |
|---|---|---|---|
| **Cidadão** | `maria.silva@exemplo.com` | `Senha@123` | Registra e acompanha ocorrências |
| **Fiscal Ambiental** | `carlos.fiscal@sedam.ro.gov.br` | `Fiscal@2026` | Altera status e emite pareceres técnicos |
| **Administrador** | `admin@ecoguard.org` | `Admin@2026` | Monitoramento global do sistema |

*Dica: Você pode alternar os perfis instantaneamente através do seletor rápido no topo da página.*

---

## 🌐 Publicação Online Gratuita (Deploy)

O repositório já está preparado para deploy no **Render** e na **Vercel**:

### Publicação no Render:
1. Acesse [render.com](https://render.com) e crie uma conta gratuita conectada ao GitHub.
2. Clique em **New +** ➔ **Web Service**.
3. Selecione o repositório `EcoGuard`.
4. O Render detectará automaticamente o arquivo `render.yaml`. Basta clicar em **Create Web Service**.
5. Em cerca de 2 minutos, a URL pública estará ativa (ex.: `https://ecoguard-xxxx.onrender.com`).
