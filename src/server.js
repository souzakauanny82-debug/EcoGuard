const express = require('express');
const path = require('path');
const db = require('./database');
const { hashPassword, verifyPassword } = require('./crypto_util');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON e arquivos estáticos
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Categorias e status válidos para validação estrita no servidor (RNF02)
const CATEGORIAS_VALIDAS = [
  'Queimada',
  'Descarte Irregular de Residuos',
  'Poluicao Hidrica',
  'Desmatamento Urbano',
  'Poluicao do Ar'
];

const STATUS_VALIDOS = ['Pendente', 'Em Analise', 'Em Atendimento', 'Resolvido'];
const GRAVIDADES_VALIDAS = ['Baixa', 'Media', 'Alta', 'Critica'];

// Coordenadas aproximadas por bairro de Porto Velho para enriquecimento automático
const COORDENADAS_BAIRROS = {
  'Calama': { lat: -8.7391, lng: -63.8745 },
  'Panair': { lat: -8.7562, lng: -63.9084 },
  'Nacional': { lat: -8.7314, lng: -63.8921 },
  'Nova Porto Velho': { lat: -8.7695, lng: -63.8711 },
  'Tancredo Neves': { lat: -8.7512, lng: -63.8450 },
  'Centro': { lat: -8.7619, lng: -63.9039 },
  'Embratel': { lat: -8.7480, lng: -63.8820 },
  'Olaria': { lat: -8.7530, lng: -63.8990 },
  'São Cristóvão': { lat: -8.7420, lng: -63.8900 },
  'Aponiã': { lat: -8.7350, lng: -63.8680 }
};

// ==========================================
// 1. ROTAS DE AUTENTICAÇÃO E USUÁRIOS (RF01, RF02, RNF01, RNF02)
// ==========================================

/**
 * POST /api/auth/register
 * Cadastro com validação estrita no servidor e hash criptográfico de senha
 */
app.post('/api/auth/register', (req, res) => {
  const { nome, email, senha, tipo_usuario } = req.body;

  // Validação no Servidor (RNF02)
  const erros = [];
  if (!nome || typeof nome !== 'string' || nome.trim().length < 3) {
    erros.push('O nome deve ter no mínimo 3 caracteres.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    erros.push('Informe um endereço de e-mail válido.');
  }

  if (!senha || typeof senha !== 'string' || senha.length < 6) {
    erros.push('A senha deve ter no mínimo 6 caracteres.');
  }

  if (erros.length > 0) {
    return res.status(400).json({ error: 'Falha na validação dos dados.', detalhes: erros });
  }

  // Verificar se o e-mail já existe
  const usuarioExistente = db.findUserByEmail(email);
  if (usuarioExistente) {
    return res.status(409).json({ error: 'Este e-mail já está cadastrado no sistema.' });
  }

  try {
    // Hash da senha (RNF01)
    const senhaHash = hashPassword(senha);
    const perfil = tipo_usuario === 'fiscal' ? 'fiscal' : 'cidadao';
    const novoId = db.createUser(nome, email, senhaHash, perfil);
    const usuarioCriado = db.findUserById(novoId);

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      user: usuarioCriado
    });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
  }
});

/**
 * POST /api/auth/login
 * Autenticação comparando hash criptográfico seguro
 */
app.post('/api/auth/login', (req, res) => {
  const { email, senha } = req.body;

  // Validação no Servidor
  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const usuario = db.findUserByEmail(email);
  if (!usuario) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  }

  const senhaValida = verifyPassword(senha, usuario.senha_hash);
  if (!senhaValida) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  }

  return res.json({
    message: 'Login realizado com sucesso!',
    user: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario
    }
  });
});

/**
 * GET /api/auth/usuarios
 * Listagem para facilitar demonstração de perfis
 */
app.get('/api/auth/usuarios', (req, res) => {
  const usuarios = db.db.prepare('SELECT id, nome, email, tipo_usuario, criado_em FROM usuarios').all();
  res.json(usuarios);
});

// ==========================================
// 2. ROTAS DE OCORRÊNCIAS AMBIENTAIS (RF03, RF04, RF05, RF06)
// ==========================================

/**
 * GET /api/ocorrencias
 * Listagem com filtros combinados (categoria, status, bairro, busca)
 */
app.get('/api/ocorrencias', (req, res) => {
  try {
    const { categoria, status, bairro, busca } = req.query;
    const lista = db.listOcorrencias({ categoria, status, bairro, busca });
    res.json(lista);
  } catch (err) {
    console.error('Erro ao listar ocorrências:', err);
    res.status(500).json({ error: 'Erro ao consultar ocorrências no banco de dados.' });
  }
});

/**
 * GET /api/ocorrencias/:id
 * Detalhes da ocorrência com linha do tempo de histórico (RF05)
 */
app.get('/api/ocorrencias/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID da ocorrência inválido.' });
  }

  const ocorrencia = db.getOcorrenciaById(id);
  if (!ocorrencia) {
    return res.status(404).json({ error: 'Ocorrência não encontrada.' });
  }

  res.json(ocorrencia);
});

/**
 * POST /api/ocorrencias
 * Registro de nova denúncia com validação no servidor (RF03, RNF02)
 */
app.post('/api/ocorrencias', (req, res) => {
  const { usuario_id, titulo, categoria, gravidade, bairro, endereco, descricao, imagem_url } = req.body;

  // Validação no Servidor (RNF02)
  const erros = [];
  if (!usuario_id || isNaN(parseInt(usuario_id, 10))) {
    erros.push('Identificação do usuário denunciante é obrigatória.');
  }
  if (!titulo || typeof titulo !== 'string' || titulo.trim().length < 5) {
    erros.push('O título deve ter no mínimo 5 caracteres.');
  }
  if (!categoria || !CATEGORIAS_VALIDAS.includes(categoria.trim())) {
    erros.push(`Categoria inválida. Categorias permitidas: ${CATEGORIAS_VALIDAS.join(', ')}.`);
  }
  if (!bairro || typeof bairro !== 'string' || bairro.trim().length < 2) {
    erros.push('Informe o bairro da ocorrência.');
  }
  if (!endereco || typeof endereco !== 'string' || endereco.trim().length < 5) {
    erros.push('Informe o endereço ou ponto de referência detalhado.');
  }
  if (!descricao || typeof descricao !== 'string' || descricao.trim().length < 10) {
    erros.push('A descrição da ocorrência deve ter no mínimo 10 caracteres.');
  }

  const gravidadeFinal = GRAVIDADES_VALIDAS.includes(gravidade) ? gravidade : 'Media';

  if (erros.length > 0) {
    return res.status(400).json({ error: 'Validação rejeitada pelo servidor.', detalhes: erros });
  }

  // Atribuir coordenadas aproximadas caso não informadas
  const coords = COORDENADAS_BAIRROS[bairro.trim()] || { lat: -8.7619 + (Math.random() - 0.5) * 0.04, lng: -63.9039 + (Math.random() - 0.5) * 0.04 };

  try {
    const novaId = db.createOcorrencia({
      usuario_id: parseInt(usuario_id, 10),
      titulo,
      categoria,
      gravidade: gravidadeFinal,
      bairro,
      endereco,
      latitude: coords.lat,
      longitude: coords.lng,
      descricao,
      imagem_url: imagem_url || ''
    });

    const ocorrenciaCriada = db.getOcorrenciaById(novaId);
    return res.status(201).json({
      message: 'Ocorrência ambiental registrada com sucesso!',
      ocorrencia: ocorrenciaCriada
    });
  } catch (err) {
    console.error('Erro ao criar ocorrência:', err);
    return res.status(500).json({ error: 'Erro ao persistir ocorrência no banco.' });
  }
});

/**
 * PATCH /api/ocorrencias/:id/status
 * Atualização de status e parecer pelo fiscal ambiental (RF06, RNF05)
 */
app.patch('/api/ocorrencias/:id/status', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status, despacho, fiscal_id } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID da ocorrência inválido.' });
  }

  // Validação no Servidor
  const erros = [];
  if (!status || !STATUS_VALIDOS.includes(status)) {
    erros.push(`Status inválido. Status permitidos: ${STATUS_VALIDOS.join(', ')}.`);
  }
  if (!despacho || typeof despacho !== 'string' || despacho.trim().length < 5) {
    erros.push('O despacho/parecer técnico deve ter no mínimo 5 caracteres.');
  }
  if (!fiscal_id || isNaN(parseInt(fiscal_id, 10))) {
    erros.push('Identificação do fiscal responsável é obrigatória.');
  }

  if (erros.length > 0) {
    return res.status(400).json({ error: 'Validação rejeitada pelo servidor.', detalhes: erros });
  }

  try {
    const atualizada = db.updateOcorrenciaStatus(id, status, despacho, parseInt(fiscal_id, 10));
    return res.json({
      message: 'Status da ocorrência atualizado e despacho registrado no histórico!',
      ocorrencia: atualizada
    });
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    return res.status(500).json({ error: err.message || 'Erro ao atualizar status da ocorrência.' });
  }
});

// ==========================================
// 3. DASHBOARD E ESTATÍSTICAS (RF07)
// ==========================================

/**
 * GET /api/stats
 * Resumo quantitativo para o painel de fiscalização
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error('Erro nas estatísticas:', err);
    res.status(500).json({ error: 'Erro ao calcular métricas.' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  EcoGuard - Servidor Ativo na porta ${PORT}`);
  console.log(`  Acesse no navegador: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
