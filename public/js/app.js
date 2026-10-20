/**
 * EcoGuard - Aplicação Web de Monitoramento Ambiental
 * Comunicação com API REST Express, Leaflet.js e Gráficos Chart.js
 */

// Estado global da aplicação
const state = {
  currentUser: {
    id: 1,
    nome: 'Maria da Silva',
    email: 'maria.silva@exemplo.com',
    tipo_usuario: 'cidadao'
  },
  ocorrencias: [],
  map: null,
  markersLayer: null,
  activeOcorrenciaId: null,
  chartCategoria: null
};

// ==========================================
// 1. INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initCurrentUser();
  initMap();
  loadStats();
  loadOcorrencias();
  setupEventListeners();
});

// Recuperar ou inicializar usuário conectado
function initCurrentUser() {
  const saved = localStorage.getItem('ecoguard_user');
  if (saved) {
    try {
      state.currentUser = JSON.parse(saved);
    } catch (e) {
      console.warn('Erro ao restaurar usuário do localStorage.');
    }
  }
  updateUserUI();
}

function setCurrentUser(user) {
  state.currentUser = user;
  localStorage.setItem('ecoguard_user', JSON.stringify(user));
  updateUserUI();

  // Se o modal de detalhes estiver aberto, atualiza a visibilidade do painel do fiscal
  if (state.activeOcorrenciaId) {
    openDetailsModal(state.activeOcorrenciaId);
  }
}

function updateUserUI() {
  const user = state.currentUser;
  const userDisplay = document.getElementById('user-display');
  const userRole = document.getElementById('user-role');
  const userSelector = document.getElementById('demo-user-select');

  if (user) {
    userDisplay.textContent = user.nome;
    userRole.textContent = user.tipo_usuario.toUpperCase();
    userRole.className = `role-tag ${user.tipo_usuario}`;
    if (userSelector) {
      userSelector.value = user.tipo_usuario;
    }
  } else {
    userDisplay.textContent = 'Visitante';
    userRole.textContent = 'ANÔNIMO';
    userRole.className = 'role-tag';
  }
}

// ==========================================
// 2. MAPA INTERATIVO (Leaflet.js)
// ==========================================
function initMap() {
  // Centro de Porto Velho - RO
  const pvhCoords = [-8.7619, -63.9039];
  state.map = L.map('map', { scrollWheelZoom: false }).setView(pvhCoords, 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | IFRO Calama'
  }).addTo(state.map);

  state.markersLayer = L.layerGroup().addTo(state.map);
}

function updateMapMarkers(ocorrencias) {
  if (!state.markersLayer) return;
  state.markersLayer.clearLayers();

  ocorrencias.forEach(o => {
    if (!o.latitude || !o.longitude) return;

    // Cor do marcador conforme a gravidade ou status
    let markerColor = '#10b981'; // Verde (Resolvido)
    if (o.status !== 'Resolvido') {
      if (o.gravidade === 'Critica' || o.gravidade === 'Alta') {
        markerColor = '#ef4444'; // Vermelho
      } else {
        markerColor = '#f59e0b'; // Amarelo/Laranja
      }
    }

    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="
        background-color: ${markerColor};
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      "></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    const marker = L.marker([o.latitude, o.longitude], { icon: customIcon });

    const popupHtml = `
      <div style="font-family: inherit; min-width: 200px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">${o.categoria}</span>
        <h4 style="font-size: 13px; font-weight: 700; margin: 4px 0 6px 0; color: #0f172a;">${escapeHtml(o.titulo)}</h4>
        <p style="font-size: 12px; color: #475569; margin-bottom: 8px;"><strong>Bairro:</strong> ${escapeHtml(o.bairro)}</p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="card-badge-status ${getStatusClass(o.status)}" style="position: static; font-size: 10px; padding: 2px 6px;">${o.status}</span>
          <button onclick="openDetailsModal(${o.id})" style="background: #15803d; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">Detalhes</button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    state.markersLayer.addLayer(marker);
  });
}

// ==========================================
// 3. CARREGAMENTO E FILTRAGEM DE OCORRÊNCIAS
// ==========================================
async function loadOcorrencias() {
  const categoria = document.getElementById('filter-categoria')?.value || 'todas';
  const status = document.getElementById('filter-status')?.value || 'todos';
  const bairro = document.getElementById('filter-bairro')?.value || 'todos';
  const busca = document.getElementById('filter-busca')?.value || '';

  const params = new URLSearchParams();
  if (categoria !== 'todas') params.append('categoria', categoria);
  if (status !== 'todos') params.append('status', status);
  if (bairro !== 'todos') params.append('bairro', bairro);
  if (busca.trim()) params.append('busca', busca.trim());

  try {
    const res = await fetch(`/api/ocorrencias?${params.toString()}`);
    const data = await res.json();
    state.ocorrencias = data;

    renderOcorrencias(data);
    updateMapMarkers(data);
  } catch (err) {
    console.error('Erro ao buscar ocorrências:', err);
  }
}

function renderOcorrencias(lista) {
  const container = document.getElementById('ocorrencias-grid');
  const countLabel = document.getElementById('ocorrencias-count');

  if (countLabel) {
    countLabel.textContent = `${lista.length} ocorrência(s) encontrada(s)`;
  }

  if (!lista || lista.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: white; border-radius: 12px; border: 1px dashed #cbd5e1;">
        <i class="fa-solid fa-leaf" style="font-size: 2.5rem; color: #94a3b8; margin-bottom: 1rem;"></i>
        <h3 style="font-size: 1.15rem; color: #334155;">Nenhuma ocorrência encontrada com estes filtros.</h3>
        <p style="font-size: 0.9rem; color: #64748b; margin-top: 0.5rem;">Tente ajustar as opções de busca ou registre uma nova denúncia.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = lista.map(o => {
    const imgUrl = o.imagem_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80';
    const dataFormatada = formatarData(o.criado_em);

    return `
      <article class="card">
        <div class="card-img-wrap">
          <img src="${imgUrl}" alt="${escapeHtml(o.titulo)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80'">
          <span class="card-badge-status ${getStatusClass(o.status)}">${o.status}</span>
          <span class="card-badge-category">${escapeHtml(o.categoria)}</span>
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span><i class="fa-solid fa-calendar-days"></i> ${dataFormatada}</span>
            <span><i class="fa-solid fa-triangle-exclamation"></i> Gravidade: <strong>${o.gravidade}</strong></span>
          </div>
          <h3 class="card-title">${escapeHtml(o.titulo)}</h3>
          <p class="card-desc">${escapeHtml(o.descricao)}</p>
          <div class="card-footer">
            <span class="card-location">
              <i class="fa-solid fa-location-dot" style="color: #dc2626;"></i>
              ${escapeHtml(o.bairro)}
            </span>
            <button class="btn btn-outline btn-sm" onclick="openDetailsModal(${o.id})">
              Ver Detalhes
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// ==========================================
// 4. MODAL DE DETALHES E HISTÓRICO (RF05, RF06)
// ==========================================
async function openDetailsModal(id) {
  state.activeOcorrenciaId = id;
  const modal = document.getElementById('modal-details');

  try {
    const res = await fetch(`/api/ocorrencias/${id}`);
    if (!res.ok) throw new Error('Não foi possível carregar a ocorrência.');
    const o = await res.json();

    document.getElementById('detail-title').textContent = o.titulo;
    document.getElementById('detail-categoria').textContent = o.categoria;
    document.getElementById('detail-status').textContent = o.status;
    document.getElementById('detail-status').className = `card-badge-status ${getStatusClass(o.status)}`;
    document.getElementById('detail-gravidade').textContent = o.gravidade;
    document.getElementById('detail-bairro').textContent = o.bairro;
    document.getElementById('detail-endereco').textContent = o.endereco;
    document.getElementById('detail-denunciante').textContent = o.denunciante_nome;
    document.getElementById('detail-data').textContent = formatarData(o.criado_em);
    document.getElementById('detail-descricao').textContent = o.descricao;

    const imgEl = document.getElementById('detail-img');
    if (o.imagem_url) {
      imgEl.src = o.imagem_url;
      imgEl.style.display = 'block';
    } else {
      imgEl.style.display = 'none';
    }

    // Renderizar histórico / linha do tempo (RNF05)
    const timelineEl = document.getElementById('detail-timeline');
    if (!o.historico || o.historico.length === 0) {
      timelineEl.innerHTML = `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-meta">
              <span>${formatarData(o.criado_em)}</span>
              <span>Abertura</span>
            </div>
            <div class="timeline-title">Denúncia registrada no sistema</div>
            <div class="timeline-desc">Aguardando primeira triagem da equipe técnica ambiental.</div>
          </div>
        </div>
      `;
    } else {
      timelineEl.innerHTML = `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-meta">
              <span>${formatarData(o.criado_em)}</span>
              <span>Abertura</span>
            </div>
            <div class="timeline-title">Denúncia registrada no sistema</div>
            <div class="timeline-desc">Status inicial definido como Pendente.</div>
          </div>
        </div>
      ` + o.historico.map(h => `
        <div class="timeline-item">
          <div class="timeline-dot" style="background: #2563eb; box-shadow: 0 0 0 2px #2563eb;"></div>
          <div class="timeline-content">
            <div class="timeline-meta">
              <span>${formatarData(h.criado_em)}</span>
              <span style="font-weight: 600; color: #b45309;">${escapeHtml(h.fiscal_nome)} (Fiscal)</span>
            </div>
            <div class="timeline-title">Transição: ${h.status_anterior} ➔ ${h.status_novo}</div>
            <div class="timeline-desc">${escapeHtml(h.despacho)}</div>
          </div>
        </div>
      `).join('');
    }

    // Painel exclusivo do fiscal ambiental (RF06)
    const fiscalBox = document.getElementById('fiscal-action-box');
    const isFiscal = state.currentUser && (state.currentUser.tipo_usuario === 'fiscal' || state.currentUser.tipo_usuario === 'admin');

    if (isFiscal) {
      fiscalBox.style.display = 'block';
      document.getElementById('fiscal-status-select').value = o.status;
      document.getElementById('fiscal-despacho-input').value = '';
      document.getElementById('fiscal-error-msg').style.display = 'none';
    } else {
      fiscalBox.style.display = 'none';
    }

    modal.classList.add('active');
  } catch (err) {
    alert(err.message);
  }
}

// Atualização de status e parecer pelo fiscal
async function submitFiscalAction() {
  if (!state.activeOcorrenciaId) return;

  const novoStatus = document.getElementById('fiscal-status-select').value;
  const despacho = document.getElementById('fiscal-despacho-input').value.trim();
  const errorBox = document.getElementById('fiscal-error-msg');

  if (!despacho || despacho.length < 5) {
    errorBox.textContent = 'O parecer técnico é obrigatório e deve ter no mínimo 5 caracteres.';
    errorBox.style.display = 'block';
    return;
  }

  errorBox.style.display = 'none';

  try {
    const res = await fetch(`/api/ocorrencias/${state.activeOcorrenciaId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: novoStatus,
        despacho: despacho,
        fiscal_id: state.currentUser.id
      })
    });

    const data = await res.json();
    if (!res.ok) {
      errorBox.textContent = data.detalhes ? data.detalhes.join(' ') : (data.error || 'Erro ao atualizar.');
      errorBox.style.display = 'block';
      return;
    }

    // Recarregar dados e atualizar modal
    openDetailsModal(state.activeOcorrenciaId);
    loadOcorrencias();
    loadStats();
  } catch (err) {
    errorBox.textContent = 'Erro de conexão com o servidor.';
    errorBox.style.display = 'block';
  }
}

// ==========================================
// 5. REGISTRO DE NOVA OCORRÊNCIA (RF03, RNF02)
// ==========================================
async function submitNovaOcorrencia(e) {
  e.preventDefault();
  const errorBox = document.getElementById('form-nova-error');
  errorBox.style.display = 'none';

  const titulo = document.getElementById('novo-titulo').value;
  const categoria = document.getElementById('novo-categoria').value;
  const gravidade = document.getElementById('novo-gravidade').value;
  const bairro = document.getElementById('novo-bairro').value;
  const endereco = document.getElementById('novo-endereco').value;
  const descricao = document.getElementById('novo-descricao').value;
  const imagem_url = document.getElementById('novo-imagem').value;

  try {
    const res = await fetch('/api/ocorrencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: state.currentUser ? state.currentUser.id : 1,
        titulo,
        categoria,
        gravidade,
        bairro,
        endereco,
        descricao,
        imagem_url
      })
    });

    const data = await res.json();
    if (!res.ok) {
      errorBox.innerHTML = `<strong>Falha na validação do servidor:</strong><br>${data.detalhes ? data.detalhes.join('<br>') : data.error}`;
      errorBox.style.display = 'block';
      return;
    }

    // Sucesso
    closeModal('modal-nova-ocorrencia');
    document.getElementById('form-nova-ocorrencia').reset();
    loadOcorrencias();
    loadStats();
    alert('✔ Ocorrência registrada com sucesso! Ela já consta no mapa e feed com status Pendente.');
  } catch (err) {
    errorBox.textContent = 'Erro ao conectar ao servidor.';
    errorBox.style.display = 'block';
  }
}

// ==========================================
// 6. DASHBOARD E ESTATÍSTICAS (RF07)
// ==========================================
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();

    document.getElementById('stat-total').textContent = data.total;
    document.getElementById('stat-pending').textContent = data.pendentes;
    document.getElementById('stat-progress').textContent = data.emAtendimento;
    document.getElementById('stat-resolved').textContent = data.resolvidas;
    document.getElementById('stat-rate').textContent = `${data.taxaResolucao}%`;

    renderCharts(data);
  } catch (err) {
    console.error('Erro ao carregar estatísticas:', err);
  }
}

function renderCharts(data) {
  if (typeof Chart === 'undefined') return;

  const ctxCat = document.getElementById('chart-categorias');
  if (ctxCat && data.porCategoria) {
    if (state.chartCategoria) {
      state.chartCategoria.destroy();
    }

    const labels = data.porCategoria.map(c => c.categoria);
    const valores = data.porCategoria.map(c => c.total);

    state.chartCategoria = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: valores,
          backgroundColor: [
            '#ef4444', // Queimada
            '#f59e0b', // Descarte
            '#0284c7', // Hídrica
            '#10b981', // Desmatamento
            '#64748b'  // Ar
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}

// ==========================================
// 7. AUTENTICAÇÃO E TROCA RÁPIDA DE PERFIS
// ==========================================
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const senha = document.getElementById('login-senha').value;
  const errorBox = document.getElementById('login-error');
  errorBox.style.display = 'none';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await res.json();
    if (!res.ok) {
      errorBox.textContent = data.error || 'Credenciais inválidas.';
      errorBox.style.display = 'block';
      return;
    }

    setCurrentUser(data.user);
    closeModal('modal-auth');
    alert(`Bem-vindo(a), ${data.user.nome}!`);
  } catch (err) {
    errorBox.textContent = 'Erro ao contatar o servidor.';
    errorBox.style.display = 'block';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const nome = document.getElementById('reg-nome').value;
  const email = document.getElementById('reg-email').value;
  const senha = document.getElementById('reg-senha').value;
  const tipo_usuario = document.getElementById('reg-tipo').value;
  const errorBox = document.getElementById('register-error');
  errorBox.style.display = 'none';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha, tipo_usuario })
    });

    const data = await res.json();
    if (!res.ok) {
      errorBox.innerHTML = `<strong>Falha no cadastro:</strong><br>${data.detalhes ? data.detalhes.join('<br>') : data.error}`;
      errorBox.style.display = 'block';
      return;
    }

    setCurrentUser(data.user);
    closeModal('modal-auth');
    alert(`Conta criada com sucesso! Bem-vindo(a), ${data.user.nome}.`);
  } catch (err) {
    errorBox.textContent = 'Erro ao contatar o servidor.';
    errorBox.style.display = 'block';
  }
}

// Troca de perfil via dropdown de demonstração
function quickSwitchUser(role) {
  if (role === 'cidadao') {
    setCurrentUser({
      id: 1,
      nome: 'Maria da Silva',
      email: 'maria.silva@exemplo.com',
      tipo_usuario: 'cidadao'
    });
  } else if (role === 'fiscal') {
    setCurrentUser({
      id: 2,
      nome: 'Carlos Eduardo Fiscal',
      email: 'carlos.fiscal@sedam.ro.gov.br',
      tipo_usuario: 'fiscal'
    });
  } else if (role === 'admin') {
    setCurrentUser({
      id: 3,
      nome: 'Administrador Geral',
      email: 'admin@ecoguard.org',
      tipo_usuario: 'admin'
    });
  }
}

// ==========================================
// 8. EVENT LISTENERS E UTILITÁRIOS
// ==========================================
function setupEventListeners() {
  // Filtros
  ['filter-categoria', 'filter-status', 'filter-bairro'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', loadOcorrencias);
  });

  document.getElementById('filter-busca')?.addEventListener('input', debounce(loadOcorrencias, 300));

  // Formulários
  document.getElementById('form-nova-ocorrencia')?.addEventListener('submit', submitNovaOcorrencia);
  document.getElementById('form-login')?.addEventListener('submit', handleLogin);
  document.getElementById('form-register')?.addEventListener('submit', handleRegister);
  document.getElementById('btn-fiscal-submit')?.addEventListener('click', submitFiscalAction);

  // Switcher de demonstração
  document.getElementById('demo-user-select')?.addEventListener('change', (e) => {
    quickSwitchUser(e.target.value);
  });

  // Fechar modais ao clicar no overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
}

function openModal(id) {
  document.getElementById(id)?.classList.add('active');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

function toggleAuthTab(tab) {
  const loginForm = document.getElementById('form-login');
  const regForm = document.getElementById('form-register');
  const tabLogin = document.getElementById('tab-login');
  const tabReg = document.getElementById('tab-reg');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    regForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    regForm.style.display = 'block';
    tabLogin.classList.remove('active');
    tabReg.classList.add('active');
  }
}

function setQuickImage(url) {
  const input = document.getElementById('novo-imagem');
  if (input) input.value = url;
}

function getStatusClass(status) {
  switch (status) {
    case 'Pendente': return 'status-pendente';
    case 'Em Analise': return 'status-em-analise';
    case 'Em Atendimento': return 'status-em-atendimento';
    case 'Resolvido': return 'status-resolvido';
    default: return '';
  }
}

function formatarData(dataStr) {
  if (!dataStr) return '';
  try {
    const d = new Date(dataStr.replace(' ', 'T'));
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dataStr;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
