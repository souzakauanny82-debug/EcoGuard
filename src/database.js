const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const { hashPassword } = require('./crypto_util');

const DB_PATH = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(__dirname, '..', 'ecoguard.db');
const db = new DatabaseSync(DB_PATH);

// Habilitar integridade referencial de chave estrangeira
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Criação do Esquema de Banco de Dados Relacional (DER simples)
 * Satisfaz a Seção 6 da spec com relacionamentos e integridade referencial
 */
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      tipo_usuario TEXT NOT NULL DEFAULT 'cidadao', -- 'cidadao', 'fiscal', 'admin'
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ocorrencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      categoria TEXT NOT NULL,
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
  `);

  seedInitialData();
}

/**
 * Carga inicial de dados realistas de Porto Velho - RO
 */
function seedInitialData() {
  const countUsers = db.prepare('SELECT COUNT(*) as count FROM usuarios').get().count;
  if (countUsers > 0) {
    return; // Já populado
  }

  console.log('[Banco de Dados] Populando dados iniciais do EcoGuard...');

  // 1. Usuários de demonstração com hash PBKDF2/SHA-512 (RNF01)
  const insertUser = db.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario)
    VALUES (?, ?, ?, ?)
  `);

  const u1 = insertUser.run('Maria da Silva', 'maria.silva@exemplo.com', hashPassword('Senha@123'), 'cidadao');
  const u2 = insertUser.run('Carlos Eduardo Fiscal', 'carlos.fiscal@sedam.ro.gov.br', hashPassword('Fiscal@2026'), 'fiscal');
  const u3 = insertUser.run('Administrador Geral', 'admin@ecoguard.org', hashPassword('Admin@2026'), 'admin');

  const cidadaoId = Number(u1.lastInsertRowid);
  const fiscalId = Number(u2.lastInsertRowid);

  // 2. Ocorrências ambientais de Porto Velho
  const insertOcorrencia = db.prepare(`
    INSERT INTO ocorrencias (
      usuario_id, titulo, categoria, gravidade, bairro, endereco, latitude, longitude, descricao, imagem_url, status, criado_em, atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertHistorico = db.prepare(`
    INSERT INTO historico_atendimento (ocorrencia_id, fiscal_id, status_anterior, status_novo, despacho, criado_em)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Ocorrência 1
  const o1 = insertOcorrencia.run(
    cidadaoId,
    'Foco de queimada e fumaça densa em terreno baldio',
    'Queimada',
    'Alta',
    'Calama',
    'Av. Calama com Rua Daniela, próximo à rotatória',
    -8.7391,
    -63.8745,
    'Moradores relatam queima criminosa de folhas secas e lixo que se espalhou para a vegetação ao lado das residências. Fumaça invadindo as casas e afetando crianças asmáticas.',
    'https://images.unsplash.com/photo-1602980085444-77cc8682928e?auto=format&fit=crop&w=800&q=80',
    'Em Atendimento',
    '2026-10-18 14:20:00',
    '2026-10-19 09:30:00'
  );
  insertHistorico.run(
    Number(o1.lastInsertRowid),
    fiscalId,
    'Pendente',
    'Em Analise',
    'Denúncia triada e repassada para equipe de brigada contra incêndios urbanos.',
    '2026-10-18 16:00:00'
  );
  insertHistorico.run(
    Number(o1.lastInsertRowid),
    fiscalId,
    'Em Analise',
    'Em Atendimento',
    'Viatura de fiscalização ambiental deslocada ao local para conter foco e identificar o proprietário do lote.',
    '2026-10-19 09:30:00'
  );

  // Ocorrência 2
  const o2 = insertOcorrencia.run(
    cidadaoId,
    'Descarte clandestino de carcaças e pneus no Rio Madeira',
    'Descarte Irregular de Residuos',
    'Critica',
    'Panair',
    'Rua Beira Mar, orla fluvial próximo ao Mercado do Peixe',
    -8.7562,
    -63.9084,
    'Caminhão realizou despejo de mais de 40 pneus usados e entulhos de construção civil diretamente no barranco do Rio Madeira durante a madrugada, com risco de contaminação e proliferação de vetores.',
    'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80',
    'Em Analise',
    '2026-10-19 08:15:00',
    '2026-10-19 11:00:00'
  );
  insertHistorico.run(
    Number(o2.lastInsertRowid),
    fiscalId,
    'Pendente',
    'Em Analise',
    'Solicitada averiguação das câmeras de monitoramento da Capitania e envio de fiscal de saneamento.',
    '2026-10-19 11:00:00'
  );

  // Ocorrência 3
  const o3 = insertOcorrencia.run(
    cidadaoId,
    'Despejo de efluente industrial no Igarapé dos Tanques',
    'Poluicao Hidrica',
    'Alta',
    'Nacional',
    'Rua Senador Álvaro Maia, ponte do igarapé',
    -8.7314,
    -63.8921,
    'Água do igarapé com coloração escura e forte odor químico. Mortandade visível de pequenos alevinos e peixes nativos da margem.',
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    'Pendente',
    '2026-10-20 09:40:00',
    '2026-10-20 09:40:00'
  );

  // Ocorrência 4
  const o4 = insertOcorrencia.run(
    cidadaoId,
    'Supressão de castanheiras e árvores nativas em área urbana',
    'Desmatamento Urbano',
    'Media',
    'Nova Porto Velho',
    'Rua Amazonas com Rua Guaporé',
    -8.7695,
    -63.8711,
    'Motosserra em operação derrubando árvores nativas de grande porte em terreno murado sem placa de licenciamento ambiental visível.',
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    'Resolvido',
    '2026-10-15 10:00:00',
    '2026-10-17 15:45:00'
  );
  insertHistorico.run(
    Number(o4.lastInsertRowid),
    fiscalId,
    'Pendente',
    'Em Atendimento',
    'Fiscalização compareceu ao local e embargou obra por ausência de autorização de supressão vegetal.',
    '2026-10-16 11:20:00'
  );
  insertHistorico.run(
    Number(o4.lastInsertRowid),
    fiscalId,
    'Em Atendimento',
    'Resolvido',
    'Auto de infração lavrado nº 8412/2026. Proprietário multado e obrigado a realizar reposição florestal compensatória.',
    '2026-10-17 15:45:00'
  );

  // Ocorrência 5
  insertOcorrencia.run(
    cidadaoId,
    'Queima noturna contínua de resíduos hospitalares/plásticos',
    'Poluicao do Ar',
    'Alta',
    'Tancredo Neves',
    'Rua José Amador dos Reis, fundos de galpão',
    -8.7512,
    -63.8450,
    'Fumaça tóxica preta sendo expelida todas as noites após as 22h por incineração clandestina de restos plásticos e borrachas.',
    'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?auto=format&fit=crop&w=800&q=80',
    'Pendente',
    '2026-10-20 11:15:00',
    '2026-10-20 11:15:00'
  );

  console.log('[Banco de Dados] Dados iniciais inseridos com sucesso!');
}

// Inicializar imediatamente
initSchema();

module.exports = {
  db,

  // --- Usuários ---
  findUserByEmail(email) {
    return db.prepare('SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?)').get(email.trim());
  },

  findUserById(id) {
    return db.prepare('SELECT id, nome, email, tipo_usuario, criado_em FROM usuarios WHERE id = ?').get(id);
  },

  createUser(nome, email, senhaHash, tipo = 'cidadao') {
    const stmt = db.prepare(`
      INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(nome.trim(), email.trim().toLowerCase(), senhaHash, tipo);
    return Number(info.lastInsertRowid);
  },

  // --- Ocorrências ---
  listOcorrencias({ categoria, status, bairro, busca } = {}) {
    let sql = `
      SELECT o.*, u.nome AS denunciante_nome, u.email AS denunciante_email
      FROM ocorrencias o
      INNER JOIN usuarios u ON o.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (categoria && categoria !== 'todas') {
      sql += ' AND o.categoria = ?';
      params.push(categoria);
    }
    if (status && status !== 'todos') {
      sql += ' AND o.status = ?';
      params.push(status);
    }
    if (bairro && bairro !== 'todos') {
      sql += ' AND o.bairro = ?';
      params.push(bairro);
    }
    if (busca && busca.trim()) {
      sql += ' AND (o.titulo LIKE ? OR o.descricao LIKE ? OR o.endereco LIKE ?)';
      const term = `%${busca.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY o.id DESC';
    return db.prepare(sql).all(...params);
  },

  getOcorrenciaById(id) {
    const ocorrencia = db.prepare(`
      SELECT o.*, u.nome AS denunciante_nome, u.email AS denunciante_email
      FROM ocorrencias o
      INNER JOIN usuarios u ON o.usuario_id = u.id
      WHERE o.id = ?
    `).get(id);

    if (!ocorrencia) return null;

    const historico = db.prepare(`
      SELECT h.*, u.nome AS fiscal_nome
      FROM historico_atendimento h
      INNER JOIN usuarios u ON h.fiscal_id = u.id
      WHERE h.ocorrencia_id = ?
      ORDER BY h.id ASC
    `).all(id);

    return { ...ocorrencia, historico };
  },

  createOcorrencia(data) {
    const stmt = db.prepare(`
      INSERT INTO ocorrencias (
        usuario_id, titulo, categoria, gravidade, bairro, endereco, latitude, longitude, descricao, imagem_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendente')
    `);
    const info = stmt.run(
      data.usuario_id,
      data.titulo.trim(),
      data.categoria.trim(),
      data.gravidade || 'Media',
      data.bairro.trim(),
      data.endereco.trim(),
      data.latitude || -8.7619,
      data.longitude || -63.9039,
      data.descricao.trim(),
      data.imagem_url || ''
    );
    return Number(info.lastInsertRowid);
  },

  updateOcorrenciaStatus(ocorrenciaId, novoStatus, despacho, fiscalId) {
    const atual = db.prepare('SELECT status FROM ocorrencias WHERE id = ?').get(ocorrenciaId);
    if (!atual) {
      throw new Error('Ocorrência não encontrada.');
    }

    const updateStmt = db.prepare(`
      UPDATE ocorrencias
      SET status = ?, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(novoStatus, ocorrenciaId);

    const histStmt = db.prepare(`
      INSERT INTO historico_atendimento (ocorrencia_id, fiscal_id, status_anterior, status_novo, despacho)
      VALUES (?, ?, ?, ?, ?)
    `);
    histStmt.run(ocorrenciaId, fiscalId, atual.status, novoStatus, despacho.trim());

    return this.getOcorrenciaById(ocorrenciaId);
  },

  // --- Estatísticas para o Dashboard (RF07) ---
  getDashboardStats() {
    const total = db.prepare('SELECT COUNT(*) as count FROM ocorrencias').get().count;
    const pendentes = db.prepare("SELECT COUNT(*) as count FROM ocorrencias WHERE status = 'Pendente'").get().count;
    const emAtendimento = db.prepare("SELECT COUNT(*) as count FROM ocorrencias WHERE status IN ('Em Analise', 'Em Atendimento')").get().count;
    const resolvidas = db.prepare("SELECT COUNT(*) as count FROM ocorrencias WHERE status = 'Resolvido'").get().count;

    const porCategoria = db.prepare(`
      SELECT categoria, COUNT(*) as total
      FROM ocorrencias
      GROUP BY categoria
      ORDER BY total DESC
    `).all();

    const porBairro = db.prepare(`
      SELECT bairro, COUNT(*) as total
      FROM ocorrencias
      GROUP BY bairro
      ORDER BY total DESC
      LIMIT 6
    `).all();

    const taxaResolucao = total > 0 ? Math.round((resolvidas / total) * 100) : 0;

    return {
      total,
      pendentes,
      emAtendimento,
      resolvidas,
      taxaResolucao,
      porCategoria,
      porBairro
    };
  }
};
