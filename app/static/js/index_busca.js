let debounceTimer;
const campoBusca = document.getElementById('campo-busca');
const statusBusca = document.getElementById('status-busca');

if (!campoBusca) {
  // Página sem busca – evita fetch /buscar em telas incorretas
  console.log("Busca desativada nesta página.");
  return;
}

campoBusca.addEventListener('input', function(){
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => buscar(this.value.trim()), 400);
});

async function buscar(termo) {
  statusBusca.textContent = '⏳ Buscando...';

  const res = await fetch(`/buscar?q=${encodeURIComponent(termo)}`, {
    headers: { 'Accept':'application/json', 'X-Requested-With':'XMLHttpRequest' },
    cache: 'no-store'
  });

  if (res.status === 401) {
    statusBusca.textContent = '⚠️ Sessão expirada. Redirecionando...';
    setTimeout(() => window.location.href = '/login', 1200);
    return;
  }

  const alunos = await res.json();
  const tbody = document.getElementById('corpo-tabela');
  tbody.innerHTML = '';

  alunos.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${a.ra}</td>
      <td>${a.nome || '-'}</td>
      <td><a class="botao" href="/aluno/${a.ra}">👁️ Ver perfil</a></td>`;
    tbody.appendChild(tr);
  });

  statusBusca.textContent =
    alunos.length === 0 ? '⚠️ Nenhum resultado'
    : alunos.length === 1 ? '✅ 1 registro'
    : `✅ ${alunos.length} registros`;
}
