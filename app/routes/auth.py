from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify
from functools import wraps

bp_auth = Blueprint('auth', __name__)

USUARIOS_FIXOS = {
    'admin': 'ismart',
    'elson': 'ismart',
    'fulano': 'ismart',
    'ciclano': 'ismart'
}

def _quer_json(request):
    accept = request.headers.get('Accept', '')
    xrw = request.headers.get('X-Requested-With', '')
    return 'application/json' in accept or xrw == 'XMLHttpRequest'

def login_requerido(f):
    @wraps(f)
    def decorador(*args, **kwargs):
        if 'usuario' not in session:
            if _quer_json(request):
                return jsonify({'error': 'unauthenticated'}), 401
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorador

@bp_auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        usuario = request.form.get('usuario', '').strip().lower()
        senha = request.form.get('senha', '').strip()

        if usuario in USUARIOS_FIXOS and USUARIOS_FIXOS[usuario] == senha:
            session['usuario'] = usuario
            session.permanent = True
            return redirect(url_for('alunos.home'))

        return render_template('login.html', erro='Usuário ou senha incorretos.')
    return render_template('login.html')

@bp_auth.route('/logout')
def logout():
    session.pop('usuario', None)
    return redirect(url_for('auth.login'))
