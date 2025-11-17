const ra = window.RA_ATUAL || '';
let dados = {};

// =========================
// UTILITÁRIOS
// =========================

function sanitize(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  return (s.toLowerCase() === 'nan' || s.toLowerCase() === 'none') ? '' : s;
}

function formatarDataBR(dataISO) {
  if (!dataISO) return '-';
  const data = new Date(dataISO);
  return data.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

// helper NOVO, usado só para input type="date"
function isoToDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return "";
  return d.toISOString().slice(0, 10);
}

// =========================
// CARREGAR DADOS AO ABRIR
// =========================

window.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch(`/api/aluno/${ra}/all`);
  dados = await res.json();
  abrirAba('contato');
});

// =========================
// TROCAR ENTRE AS ABAS
// =========================

document.addEventListener('click', e => {
  if (e.target.classList.contains('tab-btn')) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    abrirAba(e.target.dataset.aba);
  }
});

function abrirAba(tipo) {
  if (tipo === 'contato') render(tipo, dados.contato || {});
  else if (tipo === 'endereco') render(tipo, dados.endereco || {});
  else if (tipo === 'curso') renderCurso(dados.curso || {});     // << só isso mudou aqui
  else if (tipo === 'status') renderStatus(dados.status || {});
  else if (tipo === 'alteracao_status') renderAlteracaoStatus();
}

// =========================
// RENDERIZAÇÃO DAS ABAS
// =========================

function render(tipo, d) {
  const c = document.getElementById('conteudo-aba');

  if (tipo === 'contato') {
    c.innerHTML = `
      <h3>📞 Contato</h3>
      <div class="grid-2">
        <div>
          <label>Email</label><input id="email" value="${sanitize(d.email)}">
          <label>Celular</label><input id="celular" value="${sanitize(d.celular)}">
          <label>Telefone Fixo</label><input id="telefone_fixo" value="${sanitize(d.telefone_fixo)}">
          <label>LinkedIn</label><input id="linkedin" value="${sanitize(d.linkedin)}">
        </div>
        <div>
          <fieldset><legend>Emergência 1</legend>
            <label>Nome</label><input id="nome_emergencia_1" value="${sanitize(d.nome_emergencia_1)}">
            <label>Telefone</label><input id="tel_emergencia_1" value="${sanitize(d.tel_emergencia_1)}">
            <label>Parentesco</label><input id="parentesco_emergencia_1" value="${sanitize(d.parentesco_emergencia_1)}">
          </fieldset>
          <fieldset><legend>Emergência 2</legend>
            <label>Nome</label><input id="nome_emergencia_2" value="${sanitize(d.nome_emergencia_2)}">
            <label>Telefone</label><input id="tel_emergencia_2" value="${sanitize(d.tel_emergencia_2)}">
            <label>Parentesco</label><input id="parentesco_emergencia_2" value="${sanitize(d.parentesco_emergencia_2)}">
          </fieldset>
        </div>
      </div>
      <div class="actions">
        <button class="salvar" onclick="salvar('contato')">💾 Salvar</button>
      </div>
      <p class="muted">
        Última modificação: 
        <b>${formatarDataBR(d.ValidFrom)}</b>
        por <b>${sanitize(d.last_modified_by)}</b>
      </p>
    `;
  }

  else if (tipo === 'endereco') {
    c.innerHTML = `
      <h3>🏠 Endereço</h3>
      <div class="grid-2">
        <div>
          <label>Rua</label><input id="rua" value="${sanitize(d.rua)}">
          <label>Número</label><input id="numero" value="${sanitize(d.numero)}">
          <label>Complemento</label><input id="complemento" value="${sanitize(d.complemento)}">
        </div>
        <div>
          <label>CEP</label><input id="cep" value="${sanitize(d.cep)}" placeholder="00000-000">
          <label>Bairro</label><input id="bairro" value="${sanitize(d.bairro)}">
        </div>
      </div>
      <div class="actions">
        <button class="salvar" onclick="salvar('endereco')">💾 Salvar</button>
      </div>
      <p class="muted">
        Última modificação:
        <b>${formatarDataBR(d.ValidFrom)}</b>
        por <b>${sanitize(d.last_modified_by)}</b>
      </p>
    `;
  }
}

function renderCurso(curso) {
  const c = document.getElementById('conteudo-aba');
  const existe = curso && Object.keys(curso).length > 0;

  c.innerHTML = `
    <h3>🎓 Curso</h3>

    <div class="grid-2">

      <div>
        <label>ID Localidade</label>
        <input id="id_localidade_cursos" value="${sanitize(curso.id_localidade_cursos)}">

        <label>ID Instituição</label>
        <input id="id_cursos_instituicoes" value="${sanitize(curso.id_cursos_instituicoes)}">

        <label>ID Tempo</label>
        <input id="id_tempo" type="number" min="0" value="${sanitize(curso.id_tempo)}">

        <label>Fonte Atualização</label>
        <input id="fonte_atualizacao" value="Front" disabled>
      </div>

      <div>
        <label>Observação Atualização</label>
        <input id="observacao_atualizacao" value="${sanitize(curso.observacao_atualizacao)}">

        <label>Data Início</label>
        <input id="data_inicio_curso" type="date" value="${isoToDateInput(curso.data_inicio_curso)}">

        <label>Data Prevista Término</label>
        <input id="data_prevista_termino_curso" type="date" value="${isoToDateInput(curso.data_prevista_termino_curso)}">

        <label>Ano Cursado Previsto</label>
        <input id="ano_cursado_previsto" value="${sanitize(curso.ano_cursado_previsto)}">

        <label>% Bolsa</label>
        <input id="percentual_bolsa_faculdade" type="number" min="0" max="100" value="${sanitize(curso.percentual_bolsa_faculdade)}">

        <label>Mensalidade</label>
        <input id="mensalidade_curso" type="number" value="${sanitize(curso.mensalidade_curso)}">

        <label>Turno</label>
        <input id="turno_curso" value="${sanitize(curso.turno_curso)}">

        <label>Periodicidade</label>
        <input id="periodicidade_curso" value="${sanitize(curso.periodicidade_curso)}">
      </div>

    </div>

    <div class="actions">
      <button class="salvar" onclick="salvarCurso()">💾 Inserir novo curso</button>
      ${existe ? `<button class="salvar" onclick="atualizarCurso()">🔄 Atualizar curso</button>` : ''}
    </div>

    ${existe ? `
      <p class="muted">
        Última modificação:
        <b>${formatarDataBR(curso.ValidFrom)}</b>
        por <b>${sanitize(curso.last_modified_by)}</b>
      </p>
    ` : ''}
  `;
}

function renderStatus(d) {
  const c = document.getElementById('conteudo-aba');

  c.innerHTML = `
    <h3>📌 Status Anual</h3>

    <div>
      <label>Status</label>
      <input id="id_status" type="number" value="${sanitize(d.id_status)}">
    </div>

    <div class="actions">
      <button class="salvar" onclick="salvarStatus()">💾 Atualizar Status</button>
    </div>

    <p class="muted">Última alteração:
      <b>${formatarDataBR(d.ValidFrom)}</b>
      por <b>${sanitize(d.last_modified_by)}</b>
    </p>
  `;
}

function renderAlteracaoStatus() {
  const c = document.getElementById('conteudo-aba');

  c.innerHTML = `
    <h3>📝 Registrar Alteração de Status</h3>

    <div>
      <label>Observação</label>
      <input id="observacao">
      
      <label>Data da Alteração</label>
      <input id="data_alteracao" type="date">
    </div>

    <div class="actions">
      <button class="salvar" onclick="salvarAlteracaoStatus()">💾 Registrar</button>
    </div>
  `;
}

// =========================
// SALVAR ALTERAÇÕES INLINE
// =========================

async function salvar(tipo) {
  const inputs = document.querySelectorAll('#conteudo-aba input');
  const payload = {};
  inputs.forEach(i => payload[i.id] = i.value);

  const btn = document.querySelector('.salvar');
  const textoOriginal = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳ Salvando...';

  try {
    const res = await fetch(`/api/aluno/${ra}/${tipo}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (res.ok) {
      alert(json.msg || 'Atualizado com sucesso!');
      setTimeout(() => location.reload(), 500);
    } else {
      alert(`Erro: ${json.msg || 'Falha ao salvar.'}`);
    }

  } catch (e) {
    console.error(e);
    alert('Erro ao conectar ao servidor.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
  }
}

async function salvarCurso() {
  const campos = [
    "id_localidade_cursos", "id_cursos_instituicoes", "id_tempo",
    "fonte_atualizacao", "observacao_atualizacao",
    "data_inicio_curso", "data_prevista_termino_curso", "data_termino_real",
    "ano_cursado_previsto", "percentual_bolsa_faculdade",
    "mensalidade_curso", "turno_curso", "periodicidade_curso"
  ];

  const payload = {};
  campos.forEach(c => {
    const el = document.getElementById(c);
    payload[c] = el ? el.value.trim() : null;
  });

  // Fonte sempre Front
  payload["fonte_atualizacao"] = "Front";

  const btn = document.querySelector('.salvar');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = "⏳ Salvando...";

  try {
    const res = await fetch(`/api/aluno/${ra}/curso/insert`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (res.ok) {
      alert("Curso inserido com sucesso!");
      setTimeout(() => location.reload(), 800);
    } else {
      alert(json.msg);
    }
  }
  catch (e) {
    console.error(e);
    alert("Erro ao salvar curso.");
  }
  finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

// NOVO: atualizar curso existente
async function atualizarCurso() {
  const campos = [
    "id_localidade_cursos", "id_cursos_instituicoes", "id_tempo",
    "fonte_atualizacao", "observacao_atualizacao",
    "data_inicio_curso", "data_prevista_termino_curso", "data_termino_real",
    "ano_cursado_previsto", "percentual_bolsa_faculdade",
    "mensalidade_curso", "turno_curso", "periodicidade_curso"
  ];

  const payload = {};
  campos.forEach(c => {
    const el = document.getElementById(c);
    payload[c] = el ? el.value.trim() : null;
  });

  payload["fonte_atualizacao"] = "Front";

  const res = await fetch(`/api/aluno/${ra}/curso/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  if (res.ok) {
    alert("Curso atualizado com sucesso!");
    location.reload();
  } else {
    alert(json.msg);
  }
}

async function salvarStatus() {
  const payload = {
    id_status: document.getElementById("id_status").value
  };

  const res = await fetch(`/api/aluno/${ra}/status/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  if (res.ok) {
    alert(json.msg);
    location.reload();
  } else {
    alert(json.msg);
  }
}

async function salvarAlteracaoStatus() {
  const payload = {
    observacao: document.getElementById("observacao").value,
    data_alteracao: document.getElementById("data_alteracao").value
  };

  const res = await fetch(`/api/aluno/${ra}/alteracao_status/insert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  if (res.ok) {
    alert(json.msg);
    location.reload();
  } else {
    alert(json.msg);
  }
}
