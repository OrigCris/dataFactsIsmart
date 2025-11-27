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
  const t = await fetch("/api/tabelas_auxiliares");
  tabelas = await t.json();

  console.log("DEBUG bases:", dados);
  console.log("DEBUG tabelas auxiliares:", tabelas);
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
  else if (tipo === 'status_mensal') renderStatusMensal(dados.status_mensal || {});
  else if (tipo === 'aluno_complemento') renderAlunoComplemento(dados.aluno_complemento || {});
  else if (tipo === 'alteracao_status') renderAlteracaoStatus(dados.alteracao_status || {});
  else if (tipo === 'es_status_meta_mensal') renderEsStatusMetaMensal(dados.es_status_meta_mensal || {});
  else if (tipo === 'reg_oportunidade') renderRegOportunidade();
  
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
        <input id="id_tempo" type="number" min="0" value="${sanitize(curso.id_tempo)}" disabled>

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

        <label>Data Término Real</label>
        <input id="data_termino_real" type="date" value="${isoToDateInput(curso.data_termino_real)}">

        <label>Ano Cursado Previsto</label>
        <input id="ano_cursado_previsto" value="${sanitize(curso.ano_cursado_previsto)}">

        <label>Possui bolsa?</label>
        <input id="possui_bolsa_faculdade" value="${sanitize(curso.possui_bolsa_faculdade)}">

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

function renderStatus(aluno) {
  const c = document.getElementById('conteudo-aba');

  const status_dp = tabelas.status_alumni_dp;

  c.innerHTML = `
    <h3>📌 Status Anual</h3>

    <label>Status</label>
    <select id="id_status">
      <option value="" ${!aluno.id_status ? "selected" : ""}>-- selecione --</option>
      ${status_dp.map(g => `
        <option value="${g.id_status}" 
          ${String(aluno.id_status) === String(g.id_status) ? "selected" : ""}>
          ${g.status}
        </option>
      `).join("")}
    </select>

    <div class="actions">
      <button class="salvar" onclick="salvarStatus()">💾 Salvar</button>
    </div>

    <p class="muted">Última alteração:
      <b>${formatarDataBR(aluno.ValidFrom)}</b>
      por <b>${sanitize(aluno.last_modified_by)}</b>
    </p>
  `;
}

function renderStatusMensal(aluno) {
  const c = document.getElementById('conteudo-aba');

  const status_dp = tabelas.status_mensal_dp;

  c.innerHTML = `
    <h3>📌 Status Mensal</h3>

    <label>Status Mensal</label>
    <select id="id_status">
      <option value="" ${!aluno.id_status ? "selected" : ""}>-- selecione --</option>
      ${status_dp.map(g => `
        <option value="${g.id_status}" 
          ${String(aluno.id_status) === String(g.id_status) ? "selected" : ""}>
          ${g.status}
        </option>
      `).join("")}
    </select>

    <label>ID Tempo</label>
    <input id="id_tempo" type="number" min="0" value="${sanitize(aluno.id_tempo)}" disabled>

    <div class="actions">
      <button class="salvar" onclick="salvarStatusMensal()">💾 Salvar</button>
    </div>

    <p class="muted">Última alteração:
      <b>${formatarDataBR(aluno.ValidFrom)}</b>
      por <b>${sanitize(aluno.last_modified_by)}</b>
    </p>
  `;
}

function renderAlteracaoStatus(aluno) {
  const c = document.getElementById('conteudo-aba');

  c.innerHTML = `
    <h3>📝 Registrar Alteração de Status</h3>

    <div>
      <label>Observação</label>
      <input id="observacao" value="${sanitize(aluno.observacao)}">
      
      <label>Data da Alteração</label>
      <input id="data_alteracao" type="date" value="${isoToDateInput(aluno.data_alteracao)}">
    </div>

    <div class="actions">
      <button class="salvar" onclick="salvarAlteracaoStatus()">💾 Salvar</button>
    </div>

    <p class="muted">Última alteração:
      <b>${formatarDataBR(aluno.ValidFrom)}</b>
      por <b>${sanitize(aluno.last_modified_by)}</b>
    </p>
  `;
}

function renderEsStatusMetaMensal(aluno) {
  const c = document.getElementById('conteudo-aba');

  const es_status_meta_dp = tabelas.es_status_meta_dp;
  const es_status_oport_dp = tabelas.es_status_oport_dp;

  c.innerHTML = `
    <h3>📌 ES Status Meta Mensal</h3>

    <label>Status Meta</label>
    <select id="id_es_status_meta">
      <option value="" ${!aluno.id_es_status_meta ? "selected" : ""}>-- selecione --</option>
      ${es_status_meta_dp.map(g => `
        <option value="${g.id_es_status_meta}" 
          ${String(aluno.id_es_status_meta) === String(g.id_es_status_meta) ? "selected" : ""}>
          ${g.status_meta}
        </option>
      `).join("")}
    </select>

    <label>Esal Status Oportunidade</label>
    <select id="id_esal_status_oportunidade">
      <option value="" ${!aluno.id_esal_status_oportunidade ? "selected" : ""}>-- selecione --</option>
      ${es_status_oport_dp.map(g => `
        <option value="${g.id_esal_status_oportunidade}" 
          ${String(aluno.id_esal_status_oportunidade) === String(g.id_esal_status_oportunidade) ? "selected" : ""}>
          ${g.status_oportunidade}
        </option>
      `).join("")}
    </select>

    <label>Top Empresa</label>
    <input id="top_empresa" type="checkbox" ${aluno.top_empresa ? "checked" : ""}>
    
    <label>ID Tempo</label>
    <input id="id_tempo" type="number" min="0" value="${sanitize(aluno.id_tempo)}" disabled>    

    <div class="actions">
      <button class="salvar" onclick="salvarEsStatusMetaMensal()">💾 Salvar</button>
    </div>

    <p class="muted">Última alteração:
      <b>${formatarDataBR(aluno.ValidFrom)}</b>
      por <b>${sanitize(aluno.last_modified_by)}</b>
    </p>
  `;
}

function renderRegOportunidade() {
  const c = document.getElementById('conteudo-aba');

  c.innerHTML = `
    <h3>📌 Registro de Oportunidade</h3>

    <label>Nível da Oportunidade</label>
    <select id="id_esal_nivel_oportunidade">
      <option value="" "selected"}>-- selecione --</option>
      ${[
          "Analista Júnior", "Analista Pleno", "Analista Sênior", "Analista de laboratório", "Assessoria Executiva", "Assessora", "Assistente",
          "Associate", "Atividade Empreendedora", "Atlética", "Autônomo", "Autônomo (Consultório/Escritório)", "Bateria", "Biomédica Geneticista",
          "Centro acadêmico", "Consultor", "Consultora", "Coordenador(a)", "Corporate Counsel", "Cursinho popular", "Digitalizadora", "Diretor(a)",
          "Empreendedor(a)/Proprietário(a)", "Empresa Júnior", "Enactus", "Engenheira", "Engenheira Nível I", "Engenheira de Dinâmica de Estruturas",
          "Engenheira de dados junior 2", "Engenheiro Jr", "Engenheiro Junior", "Engenheiro de Dados Júnior", "Engenheiro de Vendas",
          "Engenheiro de software Jr", "Engenheiro pleno", "Entidade Estudantil", "Equipe de competição", "Especialista", "Estagiário",
          "Estagiário em Segurança Hídrica", "Estágio Regular Remunerado", "Estágio de Férias", "Estágio de Férias Remunerado",
          "Estágio não remunerado", "Executivo de Negócios", "Experiência Específica", "Farmacêutico", "Geóloga JR",
          "Gerente", "Iniciação Científica", "Intercâmbio", "Internato", "Jovem Aprendiz", "Liga Acadêmica", "MEI/PJ", "Médica",
          "Médica intensivista pediátrica", "Médico Cirurgião", "Médico bolsista do programa médicos pelo Brasil", "Médico plantonista e Gerente",
          "Monitoria", "Monitora", "Operador", "Outros", "Pesquisador(a)/Professor(a)", "Projetista", "Projeto de Extensão", "RedatorSênior",
          "Sênior", "Staff Software Engineer", "Supervisor", "TCC-Monografia", "Trainee", "Trabalho Efetivo", "Trabalho Efetivo CLT",
          "Técnica de Laboratório", "Técnico administrativo", "Vereador", "Voluntariado"
        ]
        .map(t => `<option value="${t}"}>${t}</option>`)
        .join("")}
    </select>

    <label>Status da Oportunidade</label>
    <select id="id_esal_status_oportunidade">
      <option value="" "selected"}>-- selecione --</option>
      <option value="2"}>OPORTUNIDADE VALIDADA</option>
      <option value="3"}>OPORTUNIDADE NAO VALIDADA</option>
    </select>

    <label>Fonte de Atualização</label>
    <input id="fonte_atualizacao" type="text" value="Front" disabled>

    <label>Cargo da Oportunidade</label>
    <input id="cargo_oportunidade" type="text" value="">

    <label>Principais Responsabilidades</label>
    <textarea id="principais_responsabilidades"></textarea>

    <label>Área da Oportunidade</label>
    <input id="area_oportunidade" type="text" value="">

    <label>Setor da Oportunidade</label>
    <select id="setor_oportunidade">
      <option value="" "selected"}>-- selecione --</option>
      ${[
          "1° setor (público/governo)", "1º Setor (Público)", "2° setor (privado)", "2º Setor (Privado)", "3° setor (instituições sem fins lucrativos)",
          "3º Setor (Sem fins lucrativos)", "Privado", "Público", "Setor 2,5 (negócios de impacto)", "Setor 2.5", "Setor 2.5 (Negócios de Impacto)",
          "Terceiro Setor"
        ]
        .map(t => `<option value="${t}"}>${t}</option>`)
        .join("")}
    </select>

    <label>Nome da Organização</label>
    <input id="nome_organizacao" type="text" value="">

    <label>Site da Organização</label>
    <input id="site_organizacao" type="text" value="">

    <label>Início da Oportunidade</label>
    <input id="inicio_oportunidade" type="date" value="">

    <label>Término da Oportunidade</label>
    <input id="termino_oportunidade" type="date" value="">

    <label>Remuneração</label>
    <input id="remuneracao" type="number" step="0.01" value="">

    <label>Moeda da Remuneração</label>
    <select id="moeda_remuneracao">
      <option value="" "selected" }>-- selecione --</option>
      ${["Real", "Dólar", "Euro", "Libra", "Libra esterlina", "Pesos Filipinos"]
        .map(t => `<option value="${t}"}>${t}</option>`)
        .join("")}
    </select>

    <label>Indicada pelo ISMART?</label>
    <input id="indicacao_ismart" type="checkbox">

    <label>Top Empresa</label>
    <input id="top_empresa" type="checkbox">

    <label>Empresa Parceira?</label>
    <input id="empresa_parceira" type="checkbox">

    <div class="actions">
      <button class="salvar" onclick="salvarRegOportunidade()">💾 Salvar</button>
    </div>
  `;
}


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
    id_cursos_instituicoes: document.getElementById("instituicao_select").value || null,

    // Dados gerais
    id_tempo: document.getElementById("id_tempo").value || null,
    fonte_atualizacao: "Front",
    observacao_atualizacao: document.getElementById("observacao_atualizacao").value || null,

    // Datas
    data_inicio_curso: document.getElementById("data_inicio_curso").value || null,
    data_prevista_termino_curso: document.getElementById("data_prevista_termino_curso").value || null,
    data_termino_real: document.getElementById("data_termino_real").value || null,
    
    // Informações acadêmicas
    ano_cursado_previsto: document.getElementById("ano_cursado_previsto").value || null,
    possui_bolsa_faculdade: document.getElementById("possui_bolsa_faculdade").value || null,
    percentual_bolsa_faculdade: document.getElementById("percentual_bolsa_faculdade").value || null,
    mensalidade_curso: document.getElementById("mensalidade_curso").value || null,

    // Agora com selects ✔
    turno_curso: document.getElementById("turno_curso").value || null,
    periodicidade_curso: document.getElementById("periodicidade_curso").value || null
  };

  // Fonte sempre Front
  payload["fonte_atualizacao"] = "Front";
  payload["informacoes_contrato"] = "0";

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

async function salvarAlunoComplemento() {
  const payload = {
    id_raca: document.getElementById("id_raca").value || null,
    id_genero: document.getElementById("id_genero").value || null,
    nome: document.getElementById("nome").value || null,
    nome_social: document.getElementById("nome_social").value || null,
    pronome: document.getElementById("pronome").value || null,
    nome_comunicacao: document.getElementById("nome_comunicacao").value || null,
    orientacao_sexual: document.getElementById("orientacao_sexual").value || null,
    tamanho_camiseta: document.getElementById("tamanho_camiseta").value || null
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
    id_status: document.getElementById("id_status").value || null
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

async function salvarStatusMensal() {
  const payload = {
    id_status: document.getElementById("id_status").value || null,
    id_tempo: document.getElementById("id_tempo").value
  };

  const res = await fetch(`/api/aluno/${ra}/status_mensal/update`, {
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
    observacao: document.getElementById("observacao").value || null,
    data_alteracao: document.getElementById("data_alteracao").value || null
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

async function salvarEsStatusMetaMensal() {
  const payload = {
    id_es_status_meta: document.getElementById("id_es_status_meta").value || null,
    id_esal_status_oportunidade: document.getElementById("id_esal_status_oportunidade").value || null,
    top_empresa: document.getElementById("top_empresa").checked ? 1 : 0,
    id_tempo: document.getElementById("id_tempo").value
  };

  const res = await fetch(`/api/aluno/${ra}/es_status_meta_mensal/update`, {
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

async function salvarRegOportunidade() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const id_tempo = `${ano}${mes}`;   // exemplo: 202511

  const payload = {
    id_esal_nivel_oportunidade: document.getElementById("id_esal_nivel_oportunidade").value || null,
    id_esal_status_oportunidade: document.getElementById("id_esal_status_oportunidade").value || null,
    fonte_atualizacao: document.getElementById("fonte_atualizacao").value || null,
    cargo_oportunidade: document.getElementById("cargo_oportunidade").value || null,
    principais_responsabilidades: document.getElementById("principais_responsabilidades").value || null,
    area_oportunidade: document.getElementById("area_oportunidade").value || null,
    setor_oportunidade: document.getElementById("setor_oportunidade").value || null,
    nome_organizacao: document.getElementById("nome_organizacao").value || null,
    site_organizacao: document.getElementById("site_organizacao").value || null,
    inicio_oportunidade: document.getElementById("inicio_oportunidade").value || null,
    termino_oportunidade: document.getElementById("termino_oportunidade").value || null,
    remuneracao: document.getElementById("remuneracao").value || null,
    moeda_remuneracao: document.getElementById("moeda_remuneracao").value || null,
    id_tempo: id_tempo,
    // checkboxes → vira 0 ou 1
    indicacao_ismart: document.getElementById("indicacao_ismart").checked ? 1 : 0,
    top_empresa: document.getElementById("top_empresa").checked ? 1 : 0,
    empresa_parceira: document.getElementById("empresa_parceira").checked ? 1 : 0
  };

  // Chamada ao backend
  const res = await fetch(`/api/aluno/${ra}/reg_oportunidade/insert`, {
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