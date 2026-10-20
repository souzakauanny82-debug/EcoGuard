/**
 * Testes Automatizados para API e Regras de Negócio do EcoGuard
 * Validação dos critérios da atividade avaliativa (RF01-RF07, RNF01, RNF02, RNF05)
 */

const assert = require('assert');
const { hashPassword, verifyPassword } = require('../src/crypto_util');
const db = require('../src/database');

console.log('--- INICIANDO BATERIA DE TESTES DO ECOGUARD ---');

// 1. Teste de Hashing e Segurança de Senhas (RNF01)
console.log('[1/6] Testando Hashing e Verificação Criptográfica de Senhas...');
const senhaOriginal = 'MinhaSenhaForte@2026';
const hash = hashPassword(senhaOriginal);

assert(hash.includes(':'), 'O hash deve conter salt separado por dois pontos');
assert.notStrictEqual(hash, senhaOriginal, 'A senha nunca deve estar em texto puro');
assert(verifyPassword(senhaOriginal, hash) === true, 'A senha correta deve ser validada com sucesso');
assert(verifyPassword('SenhaIncorreta', hash) === false, 'A senha incorreta deve ser rejeitada');
console.log('✔ Teste 1 passou: Criptografia e verificação seguras (RNF01).');

// 2. Teste de Criação de Usuário e Autenticação (RF01, RF02)
console.log('[2/6] Testando Cadastro e Busca de Usuário...');
const testEmail = `teste_${Date.now()}@ecoguard.com`;
const userId = db.createUser('Cidadão Teste', testEmail, hashPassword('Senha123'), 'cidadao');
assert(userId > 0, 'O ID do usuário criado deve ser um inteiro positivo');

const usuarioBuscado = db.findUserByEmail(testEmail);
assert(usuarioBuscado !== undefined, 'O usuário deve ser encontrado pelo e-mail');
assert.strictEqual(usuarioBuscado.nome, 'Cidadão Teste');
assert.strictEqual(usuarioBuscado.tipo_usuario, 'cidadao');
console.log('✔ Teste 2 passou: Cadastro e consulta de usuário persistidos.');

// 3. Teste de Criação de Ocorrência (RF03, RNF02)
console.log('[3/6] Testando Criação de Ocorrência com Chave Estrangeira...');
const novaOcorrenciaId = db.createOcorrencia({
  usuario_id: userId,
  titulo: 'Descarte de baterias em calçada pública',
  categoria: 'Descarte Irregular de Residuos',
  gravidade: 'Alta',
  bairro: 'Embratel',
  endereco: 'Rua Lauro Sodré, em frente à praça',
  latitude: -8.748,
  longitude: -63.882,
  descricao: 'Várias baterias de veículos descartadas no chão vazando líquido corrosivo.',
  imagem_url: ''
});
assert(novaOcorrenciaId > 0, 'Ocorrência deve ser criada e retornar ID');

const ocorrenciaCriada = db.getOcorrenciaById(novaOcorrenciaId);
assert.strictEqual(ocorrenciaCriada.status, 'Pendente', 'Status inicial deve ser Pendente');
assert.strictEqual(ocorrenciaCriada.usuario_id, userId, 'Chave estrangeira do usuário deve coincidir');
console.log('✔ Teste 3 passou: Registro de denúncia associado ao usuário com sucesso.');

// 4. Teste de Atualização de Status e Histórico de Atendimento (RF06, RNF05)
console.log('[4/6] Testando Atualização de Status e Linha do Tempo...');
const fiscal = db.findUserByEmail('carlos.fiscal@sedam.ro.gov.br');
assert(fiscal !== undefined, 'Fiscal pré-populado deve existir');

const atualizada = db.updateOcorrenciaStatus(
  novaOcorrenciaId,
  'Em Atendimento',
  'Equipe de emergência química enviada ao local para recolhimento seguro.',
  fiscal.id
);

assert.strictEqual(atualizada.status, 'Em Atendimento');
assert(atualizada.historico.length >= 1, 'Deve existir registro no histórico');
const ultimoHist = atualizada.historico[atualizada.historico.length - 1];
assert.strictEqual(ultimoHist.status_anterior, 'Pendente');
assert.strictEqual(ultimoHist.status_novo, 'Em Atendimento');
assert.strictEqual(ultimoHist.fiscal_id, fiscal.id);
console.log('✔ Teste 4 passou: Status atualizado e histórico auditável persistido.');

// 5. Teste de Filtros de Ocorrências (RF04)
console.log('[5/6] Testando Listagem com Filtros...');
const filtradasCalama = db.listOcorrencias({ bairro: 'Calama' });
assert(Array.isArray(filtradasCalama), 'Deve retornar array');
assert(filtradasCalama.every(o => o.bairro === 'Calama'), 'Todas devem pertencer ao bairro Calama');

const filtradasQueimadas = db.listOcorrencias({ categoria: 'Queimada' });
assert(filtradasQueimadas.every(o => o.categoria === 'Queimada'), 'Todas devem ser Queimada');
console.log('✔ Teste 5 passou: Filtragem de ocorrências por bairro e categoria.');

// 6. Teste de Estatísticas do Dashboard (RF07)
console.log('[6/6] Testando Estatísticas Agregadas...');
const stats = db.getDashboardStats();
assert(typeof stats.total === 'number' && stats.total > 0, 'Total deve ser numérico');
assert(typeof stats.pendentes === 'number');
assert(typeof stats.resolvidas === 'number');
assert(Array.isArray(stats.porCategoria));
console.log('✔ Teste 6 passou: Estatísticas do painel calculadas com sucesso.');

console.log('====================================================');
console.log('🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO! 🎉');
console.log('====================================================');
