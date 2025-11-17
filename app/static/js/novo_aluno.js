const btn = document.getElementById('btn-criar');
if (btn) {
  btn.addEventListener('click', criarAluno);
}

async function criarAluno() {
  const payload = {};
  document.querySelectorAll('#form-novo input').forEach(i => payload[i.id] = i.value.trim());

  if (!payload.ra) {
    Toast('Informe o RA do aluno.', false);
    return;
  }

  const btn = document.getElementById('btn-criar');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳ Criando...';

  try {
    const res = await fetch('/api/aluno/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (res.ok) {
      Toast('✅ Aluno criado com sucesso!');
      window.location.href = `/aluno/${payload.ra}`;
    } else {
      Toast(`❌ ${json.msg}`, false);
    }
  } catch (e) {
    Toast('Erro ao criar aluno.', false);
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}
