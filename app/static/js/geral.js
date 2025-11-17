// ==============================
// Utilitários globais
// ==============================

// Seletores opcionais (não usados, mas seguros)
window.$ = (sel) => document.querySelector(sel);
window.$all = (sel) => document.querySelectorAll(sel);

// Toast simples para notificações
function Toast(msg, ok = true) {
  const t = document.createElement('div');
  t.textContent = msg;

  t.style.position = 'fixed';
  t.style.bottom = '20px';
  t.style.right = '20px';
  t.style.padding = '10px 16px';
  t.style.borderRadius = '8px';
  t.style.background = ok ? '#004aad' : '#c62828';
  t.style.color = '#fff';
  t.style.fontSize = '15px';
  t.style.boxShadow = '0 2px 10px rgba(0,0,0,.2)';
  t.style.zIndex = '9999';

  document.body.appendChild(t);

  setTimeout(() => t.remove(), 2500);
}

window.Toast = Toast;

// ==============================
// REMOVIDOS DEFINITIVAMENTE
// - AbrirModal()
// - FecharModal()
// - qualquer fetch para /modal
// ==============================
