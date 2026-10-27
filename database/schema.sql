-- =====================================================================
-- EcoGuard - Script de Criação do Banco de Dados Relacional e Seeds
-- Disciplina: Programar com IA de forma responsável
-- IFRO Campus Porto Velho Calama
-- SGBD: SQLite 3 (Compatível com PostgreSQL / MariaDB)
-- =====================================================================

-- Habilitar integridade referencial de chaves estrangeiras
PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- 1. TABELA DE USUÁRIOS (RF01, RF02, RNF01)
-- Armazena cidadãos, fiscais ambientais e administradores
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    tipo_usuario TEXT NOT NULL DEFAULT 'cidadao', -- 'cidadao', 'fiscal', 'admin'
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 2. TABELA DE OCORRÊNCIAS AMBIENTAIS (RF03, RF04, RF05)
-- Registra denúncias georreferenciadas nos bairros de Porto Velho
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ocorrencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL, -- Queimada, Descarte Irregular, Poluição Hídrica, etc.
    gravidade TEXT NOT NULL DEFAULT 'Media', -- 'Baixa', 'Media', 'Alta', 'Critica'
    bairro TEXT NOT NULL,
    endereco TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    descricao TEXT NOT NULL,
    imagem_url TEXT,
    status TEXT NOT NULL DEFAULT 'Pendente', -- 'Pendente', 'Em Analise', 'Em Atendimento', 'Resolvido'
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 3. TABELA DE HISTÓRICO DE ATENDIMENTO E PARECERES (RF06, RNF05)
-- Auditoria e rastreabilidade cronológica dos despachos de fiscalização
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historico_atendimento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ocorrencia_id INTEGER NOT NULL,
    fiscal_id INTEGER NOT NULL,
    status_anterior TEXT NOT NULL,
    status_novo TEXT NOT NULL,
    despacho TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias (id) ON DELETE CASCADE,
    FOREIGN KEY (fiscal_id) REFERENCES usuarios (id) ON DELETE CASCADE
);

-- Índices para otimização de consultas e relatórios (RNF03)
CREATE INDEX IF NOT EXISTS idx_ocorrencias_status ON ocorrencias(status);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_bairro ON ocorrencias(bairro);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_categoria ON ocorrencias(categoria);
CREATE INDEX IF NOT EXISTS idx_historico_ocorrencia ON historico_atendimento(ocorrencia_id);

-- =====================================================================
-- DADOS INICIAIS (SEEDS DE TESTE)
-- =====================================================================

-- Inserção de Usuários de Teste (Senhas geradas via PBKDF2/SHA-512)
-- Senha Maria (Cidadão): Senha@123
-- Senha Carlos (Fiscal): Fiscal@2026
-- Senha Admin: Admin@2026
INSERT OR IGNORE INTO usuarios (id, nome, email, senha_hash, tipo_usuario) VALUES
(1, 'Maria da Silva', 'maria.silva@exemplo.com', 'a3e87c53e0d86927d3b51a8264ef249e:85e865f24f796dfecb0db84860b240b991da90a78ae3fce0127be4d64234057863cbfa79fa69e5d666d98dcfddab7be6396f01dafeff887d1ef106883e20ec4e', 'cidadao'),
(2, 'Carlos Eduardo Fiscal', 'carlos.fiscal@sedam.ro.gov.br', 'c4bf29aa68bb6e2547b74457f5c56d78:7f90373e21017dfd13264c1851261cb4fba9c417936a1e944432a5142be81682cb979a02fb420efcb54ce69837a77e50c40590c9b0e2634d5ea8536ec41a1006', 'fiscal'),
(3, 'Administrador Geral', 'admin@ecoguard.org', 'b9f471e411b5123d4ee7b2c019d45e0f:f40da5a0cfbc09fe8d50bfca4768ea9c81cbb46a2ee1b75fae8fa60c52bb7a2ea56fb3ae99a0ef0c29f27ce6c085adbb4792694bbfb1990c8a329d915a774f75', 'admin');

-- Inserção de Ocorrências Realistas em Porto Velho - RO
INSERT OR IGNORE INTO ocorrencias (id, usuario_id, titulo, categoria, gravidade, bairro, endereco, latitude, longitude, descricao, imagem_url, status, criado_em, atualizado_em) VALUES
(1, 1, 'Foco de queimada e fumaça densa em terreno baldio', 'Queimada', 'Alta', 'Calama', 'Av. Calama com Rua Daniela, próximo à rotatória', -8.7391, -63.8745, 'Moradores relatam queima criminosa de folhas secas e lixo que se espalhou para a vegetação ao lado das residências.', 'https://images.unsplash.com/photo-1602980085444-77cc8682928e?auto=format&fit=crop&w=800&q=80', 'Em Atendimento', '2026-10-18 14:20:00', '2026-10-19 09:30:00'),
(2, 1, 'Descarte clandestino de carcaças e pneus no Rio Madeira', 'Descarte Irregular de Residuos', 'Critica', 'Panair', 'Rua Beira Mar, orla fluvial próximo ao Mercado do Peixe', -8.7562, -63.9084, 'Caminhão realizou despejo de mais de 40 pneus usados e entulhos de construção civil diretamente no barranco do Rio Madeira durante a madrugada.', 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80', 'Em Analise', '2026-10-19 08:15:00', '2026-10-19 11:00:00'),
(3, 1, 'Despejo de efluente industrial no Igarapé dos Tanques', 'Poluicao Hidrica', 'Alta', 'Nacional', 'Rua Senador Álvaro Maia, ponte do igarapé', -8.7314, -63.8921, 'Água do igarapé com coloração escura e forte odor químico. Mortandade visível de pequenos alevinos e peixes nativos da margem.', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80', 'Pendente', '2026-10-20 09:40:00', '2026-10-20 09:40:00'),
(4, 1, 'Supressão de castanheiras e árvores nativas em área urbana', 'Desmatamento Urbano', 'Media', 'Nova Porto Velho', 'Rua Amazonas com Rua Guaporé', -8.7695, -63.8711, 'Motosserra em operação derrubando árvores nativas de grande porte em terreno murado sem placa de licenciamento ambiental.', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', 'Resolvido', '2026-10-15 10:00:00', '2026-10-17 15:45:00'),
(5, 1, 'Queima noturna contínua de resíduos hospitalares/plásticos', 'Poluicao do Ar', 'Alta', 'Tancredo Neves', 'Rua José Amador dos Reis, fundos de galpão', -8.7512, -63.8450, 'Fumaça tóxica preta sendo expelida todas as noites após as 22h por incineração clandestina de restos plásticos e borrachas.', 'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?auto=format&fit=crop&w=800&q=80', 'Pendente', '2026-10-20 11:15:00', '2026-10-20 11:15:00');

-- Inserção de Histórico de Atendimento e Despachos Técnicos
INSERT OR IGNORE INTO historico_atendimento (id, ocorrencia_id, fiscal_id, status_anterior, status_novo, despacho, criado_em) VALUES
(1, 1, 2, 'Pendente', 'Em Analise', 'Denúncia triada e repassada para equipe de brigada contra incêndios urbanos.', '2026-10-18 16:00:00'),
(2, 1, 2, 'Em Analise', 'Em Atendimento', 'Viatura de fiscalização ambiental deslocada ao local para conter foco e identificar o proprietário do lote.', '2026-10-19 09:30:00'),
(3, 2, 2, 'Pendente', 'Em Analise', 'Solicitada averiguação das câmeras de monitoramento da Capitania e envio de fiscal de saneamento.', '2026-10-19 11:00:00'),
(4, 4, 2, 'Pendente', 'Em Atendimento', 'Fiscalização compareceu ao local e embargou obra por ausência de autorização de supressão vegetal.', '2026-10-16 11:20:00'),
(5, 4, 2, 'Em Atendimento', 'Resolvido', 'Auto de infração lavrado nº 8412/2026. Proprietário multado e obrigado a realizar reposição florestal compensatória.', '2026-10-17 15:45:00');
