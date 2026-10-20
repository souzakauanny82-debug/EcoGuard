# EcoGuard — Sistema de Monitoramento e Registro de Ocorrências Ambientais

> **Projeto e Especificação Inicial (Fase 1 e Fase 2)**  
> **Instituição:** Instituto Federal de Rondônia (IFRO) — Campus Porto Velho Calama  
> **Curso:** Técnico em Desenvolvimento de Sistemas  
> **Disciplina:** Programar com IA de forma responsável  

---

## 📌 Sobre o Projeto

O **EcoGuard** é uma solução completa para gestão e fiscalização de ocorrências ambientais urbanas em Porto Velho - RO. Permite que a comunidade registre denúncias georreferenciadas (queimadas, descarte irregular de lixo, desmatamento urbano e poluição hídrica) e que os fiscais ambientais realizem triagem, atendimento e acompanhamento transparente.

Este repositório atende a todos os critérios da **Atividade Avaliativa (Anexo A)** e da especificação técnica descrita no arquivo [`spec.md`](./spec.md).

---

## 🏆 Critérios de Avaliação Atendidos (Rubrica IFRO)

| Seção da Spec | Implementação no EcoGuard | Status |
|---|---|---|
| **1. Objetivo** | Descrição clara em 3 frases, compreensível em menos de 1 minuto, sem ambiguidades. | **Atende** |
| **2. Usuários** | 3 perfis definidos (`Cidadão`, `Fiscal Ambiental`, `Administrador`) com todas as ações e permissões. | **Atende** |
| **3. Casos de Uso** | UC01 a UC07 mapeados 1:1 com os Requisitos Funcionais sem itens soltos. | **Atende** |
| **4. Requisitos Funcionais** | RF01 a RF07 numerados, testáveis e cobrindo cadastro, login e fluxo completo de denúncia. | **Atende** |
| **5. Requisitos Não Funcionais** | Senha com hash criptográfico PBKDF2/SHA-512 (**RNF01**) e validação no servidor (**RNF02**). | **Atende** |
| **6. Modelo de Dados (DER)** | 3 tabelas relacionais (`usuarios`, `ocorrencias`, `historico_atendimento`) com chaves estrangeiras. | **Atende** |
| **7. Critérios de Aceite** | Cenários no padrão BDD (*Dado que..., Quando..., Então...*) para todos os RFs principais. | **Atende** |
| **8. Stack e Deploy** | Node.js + Express + SQLite + Leaflet.js, compatível com Render, Railway e Vercel. | **Atende** |

---

## 🚀 Como Executar o Sistema

### Pré-requisitos
- Node.js versão 20+ ou 22+ (instalado).

### Passos para Inicialização
1. Instale as dependências (caso ainda não o tenha feito):
   ```bash
   npm install
   ```

2. Inicie o servidor da aplicação:
   ```bash
   npm start
   ```

3. Abra o navegador no endereço:
   👉 **`http://localhost:3000`**

4. Para executar a suíte de testes automatizados:
   ```bash
   npm test
   ```

---

## 🔑 Contas Pré-configuradas para Testes

| Perfil | E-mail | Senha | Função no Sistema |
|---|---|---|---|
| **Cidadão** | `maria.silva@exemplo.com` | `Senha@123` | Registra e acompanha denúncias |
| **Fiscal Ambiental** | `carlos.fiscal@sedam.ro.gov.br` | `Fiscal@2026` | Altera status e registra despachos técnicos |
| **Administrador** | `admin@ecoguard.org` | `Admin@2026` | Gestão completa e monitoramento |

*Dica: Você também pode alternar entre os perfis diretamente pelo seletor rápido no topo da página.*

---

## 📁 Estrutura de Diretórios

```
EcoGuard/
├── Enunciado_Envio_Spec_Inicial.pdf    # Enunciado original da atividade do IFRO
├── spec.md                            # Especificação técnica completa (8 seções)
├── README.md                          # Este guia de execução e arquitetura
├── package.json                       # Configuração e scripts do projeto
├── ecoguard.db                        # Banco de dados SQLite relacional
├── src/
│   ├── crypto_util.js                 # Hashing de senhas seguro PBKDF2/SHA-512 (RNF01)
│   ├── database.js                    # Schema DER, integridade referencial e seeds
│   └── server.js                      # API REST com validações estritas no servidor (RNF02)
├── test/
│   └── api_test.js                    # Testes automatizados de API e regras de negócio
└── public/
    ├── index.html                     # Interface web com Leaflet.js e Chart.js
    ├── css/
    │   └── style.css                  # Estilos responsivos em tema ambiental
    └── js/
        └── app.js                     # Controlador do frontend e consumo da API
```
