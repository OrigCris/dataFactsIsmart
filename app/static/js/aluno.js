const ra = window.RA_ATUAL || '';
let dados = {};
let tabelas = {};

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

  // 1 — aluno
  const res = await fetch(`/api/aluno/${ra}/all`);
  dados = await res.json();

  // 2 — tabelas auxiliares
  const t = await fetch("/api/curso/tabelas");
  tabelas = await t.json();

  console.log("DEBUG curso:", dados);
  console.log("DEBUG tabelas:", tabelas);
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
  else if (tipo === 'curso') renderCurso(dados.curso || {});
  else if (tipo === 'status') renderStatus(dados.status || {});
  else if (tipo === 'aluno_complemento') renderAlunoComplemento(dados.aluno_complemento || {});
  else if (tipo === 'alteracao_status') renderAlteracaoStatus();
}

// =========================
// ABA CONTATO / ENDEREÇO
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

function renderAlunoComplemento(aluno) {
  const c = document.getElementById('conteudo-aba');

  const raca = tabelas.raca;
  const genero = tabelas.genero;

  c.innerHTML = `
    <h3>Aluno Complemento</h3>

    <div class="grid-2">

      <div>
        <label>Raça</label>
        <select id="id_raca">
          <option value="" ${!aluno.id_raca ? "selected" : ""}>-- selecione --</option>
          ${raca.map(r => `
            <option value="${r.id_raca}" 
              ${String(aluno.id_raca) === String(r.id_raca) ? "selected" : ""}>
              ${r.raca}
            </option>
          `).join("")}
        </select>

        <label>Gênero</label>
        <select id="id_genero">
          <option value="" ${!aluno.id_genero ? "selected" : ""}>-- selecione --</option>
          ${genero.map(g => `
            <option value="${g.id_genero}" 
              ${String(aluno.id_genero) === String(g.id_genero) ? "selected" : ""}>
              ${g.genero}
            </option>
          `).join("")}
        </select>

        <label>nome Fixo</label><input id="nome" value="${sanitize(aluno.nome)}">
        <label>nome_social</label><input id="nome_social" value="${sanitize(aluno.nome_social)}">
      </div>

      <div>
        <label>pronome</label><input id="pronome" value="${sanitize(aluno.pronome)}">
        <label>nome_comunicacao</label><input id="nome_comunicacao" value="${sanitize(aluno.nome_comunicacao)}">

        <label>Orientação sexual</label>
        <select id="orientacao_sexual">
          <option value="" ${!aluno.orientacao_sexual ? "selected" : ""}>-- selecione --</option>
          ${["HETEROSEXUAL", "DEMISEXUAL", "BISSEXUAL", "DEMISSEXUAL", "PANSEXUAL E ASSEXUAL", 
            "PANSEXUAL", "HOMOSSEXUAL", "PREFIRO NÃO RESPONDER", "OUTRO", "ASSEXUAL"]
            .map(t => `<option value="${t}" ${sanitize(aluno.orientacao_sexual) === t ? "selected" : ""}>${t}</option>`)
            .join("")}
        </select>
        
        <label>Tamanho camiseta</label>
        <select id="tamanho_camiseta">
          <option value="" ${!aluno.tamanho_camiseta ? "selected" : ""}>-- selecione --</option>
          ${["P", "M", "G", "GG", "XG", "XGG", "XXG", "EXG"]
            .map(t => `<option value="${t}" ${sanitize(aluno.tamanho_camiseta) === t ? "selected" : ""}>${t}</option>`)
            .join("")}
        </select>
      </div>

    </div>

    <div class="actions">
      <button class="salvar" onclick="salvarAlunoComplemento()">💾 Salvar</button>
    </div>

    <p class="muted">
      Última modificação: 
      <b>${formatarDataBR(aluno.ValidFrom)}</b>
      por <b>${sanitize(aluno.last_modified_by)}</b>
    </p>
  `;
}

function renderCurso(curso) {
  const c = document.getElementById('conteudo-aba');
  const existe = curso && Object.keys(curso).length > 0;

  const localidades = tabelas.localidades;
  const cursosTab = tabelas.cursos;

  // -------- CIDADES ÚNICAS --------
  const cidadesUnicas = [...new Set(localidades.map(l => l.cidade))];

  // -------- CURSOS ÚNICOS --------
  const cursosUnicos = [...new Set(cursosTab.map(cc => cc.nome_curso))];

  // Encontrar registros atuais
  const atualLocal = localidades.find(l => l.id_localidade_cursos == curso.id_localidade_cursos);
  const atualCurso = cursosTab.find(cc => cc.id_cursos_instituicoes == curso.id_cursos_instituicoes);

  // Determinar estado/país atuais
  const estadoAtual = atualLocal?.estado || "";
  const paisAtual = atualLocal?.pais || "";

  c.innerHTML = `
    <h3>🎓 Curso</h3>

    <div class="grid-2">

      <div>
        <label>Cidade</label>
        <select id="cidade_select">
          ${cidadesUnicas.map(cdd => `
            <option value="${cdd}" ${atualLocal?.cidade === cdd ? 'selected' : ''}>
              ${cdd}
            </option>
          `).join('')}
        </select>

        <label>Estado</label>
        <select id="estado_select"></select>

        <label>País</label>
        <input id="pais" disabled value="${paisAtual}">

        <label>ID Tempo</label>
        <input id="id_tempo" type="number" min="0" value="${sanitize(curso.id_tempo)}">

        <label>Fonte Atualização</label>
        <input id="fonte_atualizacao" value="Front" disabled>

        <label>Curso</label>
        <select id="curso_select">
          ${cursosUnicos.map(nc => `
            <option value="${nc}" ${atualCurso?.nome_curso === nc ? 'selected' : ''}>
              ${nc}
            </option>
          `).join('')}
        </select>

        <label>Instituição</label>
        <select id="instituicao_select"></select>

        <label>Observação Atualização</label>
        <input id="observacao_atualizacao" value="${sanitize(curso.observacao_atualizacao)}">
      </div>

      <div>
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
        <select id="turno_curso">
          <option value="" ${!curso.turno_curso ? "selected" : ""}>-- selecione --</option>
          ${["INTEGRAL", "NOTURNO", "MATUTINO", "DIURNO", "VESPERTINO"]
            .map(t => `<option value="${t}" ${sanitize(curso.turno_curso) === t ? "selected" : ""}>${t}</option>`)
            .join("")}
        </select>

        <label>Periodicidade</label>
        <select id="periodicidade_curso">
          <option value="" ${!curso.periodicidade_curso ? "selected" : ""}>-- selecione --</option>
          ${["QUADRIMESTRAL", "SEMESTRAL", "ANUAL"]
            .map(p => `<option value="${p}" ${sanitize(curso.periodicidade_curso) === p ? "selected" : ""}>${p}</option>`)
            .join("")}
        </select>

      </div>

    </div>

    <div class="actions">
      <button class="salvar" onclick="salvarCurso()">💾 Inserir novo curso</button>
    </div>

    ${existe ? `
      <p class="muted">
        Última modificação:
        <b>${formatarDataBR(curso.ValidFrom)}</b>
        por <b>${sanitize(curso.last_modified_by)}</b>
      </p>
    ` : ''}
  `;

  // -------------------------
  // EVENTOS DINÂMICOS
  // -------------------------

  const cidadeSelect = document.getElementById("cidade_select");
  const estadoSelect = document.getElementById("estado_select");
  const paisInput = document.getElementById("pais");

  const cursoSelect = document.getElementById("curso_select");
  const instSelect = document.getElementById("instituicao_select");

  // --------- Estado (filtrado pela cidade) ----------
  function atualizarEstados() {
    const cidade = cidadeSelect.value;
    const estados = [...new Set(
      localidades.filter(l => l.cidade === cidade).map(l => l.estado)
    )];

    estadoSelect.innerHTML = estados.map(est => `
      <option value="${est}" ${est === estadoAtual ? 'selected' : ''}>${est}</option>
    `).join('');

    atualizarPais();
  }

  // --------- País ----------
  function atualizarPais() {
    const cidade = cidadeSelect.value;
    const estado = estadoSelect.value;

    const local = localidades.find(
      l => l.cidade === cidade && l.estado === estado
    );

    paisInput.value = local?.pais || "";
  }

  // --------- Instituições filtradas pelo curso ----------
  function atualizarInstituicoes() {
    const cursoNome = cursoSelect.value;

    const lista = cursosTab.filter(
      c => c.nome_curso === cursoNome
    );

    instSelect.innerHTML = lista.map(l => `
      <option value="${l.id_cursos_instituicoes}">
        ${l.instituicao}
      </option>
    `).join('');

    // Selecionar automaticamente a instituição ligada ao registro atual
    if (atualCurso && atualCurso.nome_curso === cursoNome) {
      instSelect.value = atualCurso.id_cursos_instituicoes;
    }
  }

  // Inicializar selects
  atualizarEstados();
  atualizarInstituicoes();

  cidadeSelect.addEventListener("change", atualizarEstados);
  estadoSelect.addEventListener("change", atualizarPais);
  cursoSelect.addEventListener("change", atualizarInstituicoes);
}

// =========================
// ATUALIZAR CURSO
// =========================

async function salvarCurso() {
  const cidade = document.getElementById("cidade_select").value;
  const estado = document.getElementById("estado_select").value;
  const pais = document.getElementById("pais").value;

  // Encontrar o ID da localidade
  const loc = tabelas.localidades.find(
    l => l.cidade === cidade && l.estado === estado && l.pais === pais
  );

  const payload = {
    // Localidade (cidade/estado/pais convertida para o ID correspondente)
    id_localidade_cursos: loc?.id_localidade_cursos || null,

    // Curso/Instituição (sempre pega o id da instituição selecionada)
    id_cursos_instituicoes: document.getElementById("instituicao_select").value,

    // Dados gerais
    id_tempo: document.getElementById("id_tempo").value,
    fonte_atualizacao: "Front",
    observacao_atualizacao: document.getElementById("observacao_atualizacao").value,

    // Datas
    data_inicio_curso: document.getElementById("data_inicio_curso").value,
    data_prevista_termino_curso: document.getElementById("data_prevista_termino_curso").value,

    // Informações acadêmicas
    ano_cursado_previsto: document.getElementById("ano_cursado_previsto").value,
    percentual_bolsa_faculdade: document.getElementById("percentual_bolsa_faculdade").value,
    mensalidade_curso: document.getElementById("mensalidade_curso").value,

    // Agora com selects ✔
    turno_curso: document.getElementById("turno_curso").value,
    periodicidade_curso: document.getElementById("periodicidade_curso").value
  };

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

async function atualizarCurso() {

  const cidade = document.getElementById("cidade_select").value;
  const estado = document.getElementById("estado_select").value;
  const pais = document.getElementById("pais").value;

  // Encontrar o ID da localidade
  const loc = tabelas.localidades.find(
    l => l.cidade === cidade && l.estado === estado && l.pais === pais
  );

  const payload = {
    // Localidade (cidade/estado/pais convertida para o ID correspondente)
    id_localidade_cursos: loc?.id_localidade_cursos || null,

    // Curso/Instituição (sempre pega o id da instituição selecionada)
    id_cursos_instituicoes: document.getElementById("instituicao_select").value,

    // Dados gerais
    id_tempo: document.getElementById("id_tempo").value,
    fonte_atualizacao: "Front",
    observacao_atualizacao: document.getElementById("observacao_atualizacao").value,

    // Datas
    data_inicio_curso: document.getElementById("data_inicio_curso").value,
    data_prevista_termino_curso: document.getElementById("data_prevista_termino_curso").value,

    // Informações acadêmicas
    ano_cursado_previsto: document.getElementById("ano_cursado_previsto").value,
    percentual_bolsa_faculdade: document.getElementById("percentual_bolsa_faculdade").value,
    mensalidade_curso: document.getElementById("mensalidade_curso").value,

    // Agora com selects ✔
    turno_curso: document.getElementById("turno_curso").value,
    periodicidade_curso: document.getElementById("periodicidade_curso").value
  };

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
// NOVO: atualizar curso existente

async function salvarAlunoComplemento() {
  const payload = {
    id_raca: document.getElementById("id_raca").value,
    id_genero: document.getElementById("id_genero").value,
    nome: document.getElementById("nome").value,
    nome_social: document.getElementById("nome_social").value,
    pronome: document.getElementById("pronome").value,
    nome_comunicacao: document.getElementById("nome_comunicacao").value,
    orientacao_sexual: document.getElementById("orientacao_sexual").value,
    tamanho_camiseta: document.getElementById("tamanho_camiseta").value
  };

  const res = await fetch(`/api/aluno/${ra}/aluno_cmp/update`, {
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
