/* ===== ADMIN DASHBOARD JS ===== */

const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('adminToken');
let paginaAtual = 1;
const itensPorPagina = 10;

// ===== VERIFICAR LOGIN =====
if (token) {
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('dashboardContainer').style.display = 'block';
  carregarContatos();
  carregarEstatisticas();
} else {
  document.getElementById('loginContainer').style.display = 'flex';
  document.getElementById('dashboardContainer').style.display = 'none';
}

// ===== LOGIN =====
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  
  try {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('adminToken', data.token);
      token = data.token;
      document.getElementById('loginContainer').style.display = 'none';
      document.getElementById('dashboardContainer').style.display = 'block';
      carregarContatos();
      carregarEstatisticas();
    } else {
      document.getElementById('loginError').textContent = data.erro || 'Erro ao fazer login';
    }
  } catch (err) {
    document.getElementById('loginError').textContent = 'Erro de conexão';
  }
});

// ===== LOGOUT =====
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('adminToken');
  token = null;
  document.getElementById('loginContainer').style.display = 'flex';
  document.getElementById('dashboardContainer').style.display = 'none';
  document.getElementById('loginForm').reset();
});

// ===== CARREGAR CONTATOS =====
async function carregarContatos(pagina = 1) {
  paginaAtual = pagina;
  
  const area = document.getElementById('filtroArea').value;
  const status = document.getElementById('filtroStatus').value;
  
  try {
    const params = new URLSearchParams({
      pagina,
      limite: itensPorPagina,
      ...(area && { area }),
      ...(status && { status }),
    });
    
    const response = await fetch(`${API_URL}/contatos?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const data = await response.json();
    
    preencherTabela(data.contatos);
    preencherPaginacao(data.paginas, pagina);
  } catch (err) {
    console.error('Erro ao carregar contatos:', err);
  }
}

// ===== PREENCHER TABELA =====
function preencherTabela(contatos) {
  const tbody = document.getElementById('contatosBody');
  tbody.innerHTML = '';
  
  if (contatos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum contato encontrado</td></tr>';
    return;
  }
  
  contatos.forEach(contato => {
    const row = document.createElement('tr');
    const data = new Date(contato.dataContato).toLocaleDateString('pt-BR');
    
    row.innerHTML = `
      <td>${contato.nome}</td>
      <td>${contato.email}</td>
      <td>${contato.whatsapp}</td>
      <td>${contato.area}</td>
      <td>${data}</td>
      <td>
        <span class="status-badge status-${contato.status}">
          ${contato.status}
        </span>
      </td>
      <td>
        <button class="btn-detalhes" onclick="abrirDetalhes('${contato._id}')">
          Ver
        </button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// ===== PREENCHER PAGINAÇÃO =====
function preencherPaginacao(totalPaginas, paginaAtual) {
  const paginacao = document.getElementById('paginacao');
  paginacao.innerHTML = '';
  
  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = i === paginaAtual ? 'active' : '';
    btn.onclick = () => carregarContatos(i);
    paginacao.appendChild(btn);
  }
}

// ===== CARREGAR ESTATÍSTICAS =====
async function carregarEstatisticas() {
  try {
    const response = await fetch(`${API_URL}/stats`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const data = await response.json();
    
    document.getElementById('totalContatos').textContent = data.total;
    document.getElementById('novosContatos').textContent = data.novos;
    document.getElementById('respondidosContatos').textContent = data.respondidos;
    
    if (data.porArea.length > 0) {
      const areaMaisProcurada = data.porArea.reduce((a, b) => 
        a.count > b.count ? a : b
      );
      document.getElementById('areaMaisProcurada').textContent = areaMaisProcurada._id;
    }
  } catch (err) {
    console.error('Erro ao carregar estatísticas:', err);
  }
}

// ===== ABRIR DETALHES =====
async function abrirDetalhes(id) {
  try {
    const response = await fetch(`${API_URL}/contatos/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const contato = await response.json();
    const data = new Date(contato.dataContato).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    document.getElementById('detalheNome').textContent = contato.nome;
    document.getElementById('detalheEmail').textContent = contato.email;
    document.getElementById('detalheWhatsapp').textContent = contato.whatsapp;
    document.getElementById('detalheArea').textContent = contato.area;
    document.getElementById('detalheData').textContent = data;
    document.getElementById('detalheStatus').textContent = contato.status;
    document.getElementById('detalheMensagem').textContent = contato.mensagem;
    document.getElementById('novoStatus').value = contato.status;
    
    document.getElementById('atualizarStatusBtn').onclick = () => 
      atualizarStatus(id);
    
    document.getElementById('detalhesModal').style.display = 'block';
  } catch (err) {
    console.error('Erro ao carregar detalhes:', err);
  }
}

// ===== ATUALIZAR STATUS =====
async function atualizarStatus(id) {
  const novoStatus = document.getElementById('novoStatus').value;
  
  try {
    const response = await fetch(`${API_URL}/contatos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status: novoStatus }),
    });
    
    if (response.ok) {
      alert('Status atualizado com sucesso!');
      document.getElementById('detalhesModal').style.display = 'none';
      carregarContatos(paginaAtual);
      carregarEstatisticas();
    }
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
  }
}

// ===== EXPORTAR CSV =====
document.getElementById('exportBtn').addEventListener('click', async () => {
  try {
    const response = await fetch(`${API_URL}/contatos/exportar/csv`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contatos.csv';
    a.click();
  } catch (err) {
    console.error('Erro ao exportar:', err);
  }
});

// ===== FILTROS =====
document.getElementById('filtroArea').addEventListener('change', () => carregarContatos(1));
document.getElementById('filtroStatus').addEventListener('change', () => carregarContatos(1));

document.getElementById('buscaTermo').addEventListener('input', async (e) => {
  const termo = e.target.value;
  
  if (termo.length < 2) {
    carregarContatos(1);
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/contatos/buscar/${termo}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const contatos = await response.json();
    preencherTabela(contatos);
  } catch (err) {
    console.error('Erro ao buscar:', err);
  }
});

// ===== MODAL =====
const modal = document.getElementById('detalhesModal');
const closeBtn = document.querySelector('.close');

closeBtn.onclick = () => {
  modal.style.display = 'none';
};

window.onclick = (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};

console.log('✅ Dashboard carregado com sucesso!');