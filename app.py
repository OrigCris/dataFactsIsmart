from flask import Flask, render_template, request, jsonify, session, redirect, url_for, g
from datetime import datetime, timedelta
from functools import wraps
import pymssql
import logging

app = Flask(__name__)
app.secret_key = "super-secret"  # ⚠️ Trocar em produção
app.permanent_session_lifetime = timedelta(minutes=30)

# ======================================================
# 🔒 Usuários fixos (simplificação temporária)
# ======================================================
USUARIOS_FIXOS = {
    "admin": "ismart",
    "elson": "ismart",
    "fulano": "ismart",
    "ciclano": "ismart"
}

# ======================================================
# 💾 Conexão SQL Server (com reaproveitamento)
# ======================================================
server = 'ismart-sql-server.database.windows.net'
database = 'dev-ismart-sql-db'
username = 'ismart'
password = 'Adminsmart!'

def get_connection():
    """Abre conexão MSSQL reutilizável por request"""
    if 'conn' not in g:
        g.conn = pymssql.connect(
            server=server,
            user=username,
            password=password,
            database=database,
            port=1433
        )
    return g.conn

@app.teardown_appcontext
def close_connection(exception):
    conn = g.pop('conn', None)
    if conn:
        conn.close()

# ======================================================
# 🔐 Sessão e autenticação
# ======================================================
def _quer_json():
    """Detecta se o request espera JSON (fetch, axios, etc.)"""
    accept = request.headers.get("Accept", "")
    xrw = request.headers.get("X-Requested-With", "")
    return "application/json" in accept or xrw == "XMLHttpRequest"

def login_requerido(f):
    @wraps(f)
    def decorador(*args, **kwargs):
        if 'usuario' not in session:
            if _quer_json():
                return jsonify({"error": "unauthenticated"}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorador

# ======================================================
# 🔑 Login / Logout
# ======================================================
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        usuario = request.form.get('usuario', '').strip().lower()
        senha = request.form.get('senha', '').strip()

        if usuario in USUARIOS_FIXOS and USUARIOS_FIXOS[usuario] == senha:
            session['usuario'] = usuario
            session.permanent = True
            app.logger.info(f"✅ Login bem-sucedido: {usuario}")
            return redirect(url_for('home'))

        app.logger.warning(f"❌ Tentativa de login inválida: {usuario}")
        return render_template('login.html', erro="Usuário ou senha incorretos.")
    return render_template('login.html')

@app.route('/logout')
def logout():
    usuario = session.pop('usuario', None)
    if usuario:
        app.logger.info(f"🔒 Logout: {usuario}")
    return redirect(url_for('login'))

# ======================================================
# 🏠 Página inicial (lista de alunos)
# ======================================================
@app.route('/')
@login_requerido
def home():
    conn = get_connection()
    cursor = conn.cursor(as_dict=True)
    cursor.execute("""
        SELECT TOP 100 
            ra, UPPER(nome) AS nome
        FROM dbo.data_facts_ismart_aluno_complemento
        ORDER BY ra ASC
    """)
    alunos = cursor.fetchall()
    return render_template(
        'index.html',
        alunos=alunos,
        usuario=session['usuario'],
        current_year=datetime.now().year
    )

# ======================================================
# 🔍 Busca (RA ou nome)
# ======================================================
@app.route('/buscar')
@login_requerido
def buscar():
    termo = request.args.get('q', '').strip()
    conn = get_connection()
    cursor = conn.cursor(as_dict=True)

    query_base = """
        SELECT TOP 100 
            ra, UPPER(nome) AS nome
        FROM dbo.data_facts_ismart_aluno_complemento
    """

    if termo:
        like = f"%{termo}%"
        cursor.execute(f"{query_base} WHERE ra LIKE %s OR nome LIKE %s ORDER BY ra ASC", (like, like))
    else:
        cursor.execute(f"{query_base} ORDER BY ra ASC")

    alunos = cursor.fetchall()
    return jsonify(alunos)

# ======================================================
# 👤 Página de perfil (abas)
# ======================================================
@app.route('/aluno/<ra>')
@login_requerido
def aluno_detalhe(ra):
    return render_template(
        'aluno.html',
        ra=ra,
        usuario=session['usuario'],
        current_year=datetime.now().year
    )

# ======================================================
# 🚀 API única — dados completos do aluno
# ======================================================
@app.route('/api/aluno/<ra>/all')
@login_requerido
def api_aluno_all(ra):
    conn = get_connection()
    cursor = conn.cursor(as_dict=True)

    # Dados de contato
    cursor.execute("""
        SELECT ra, email, celular, telefone_fixo, linkedin,
               nome_emergencia_1, tel_emergencia_1, parentesco_emergencia_1,
               nome_emergencia_2, tel_emergencia_2, parentesco_emergencia_2,
               last_modified_by, ValidFrom
        FROM dbo.data_facts_ismart_contato_aluno_v2
        WHERE ra = %s
    """, (ra,))
    contato = cursor.fetchone() or {}

    # Endereço
    cursor.execute("""
        SELECT ra, rua, numero, complemento, cep, bairro, last_modified_by, ValidFrom
        FROM dbo.data_facts_ismart_endereco_aluno_v2
        WHERE ra = %s
    """, (ra,))
    endereco = cursor.fetchone() or {}

    return jsonify({"contato": contato, "endereco": endereco})

# ======================================================
# ✏️ Atualização dinâmica   
# ======================================================
@app.route('/api/aluno/<ra>/<tipo>/update', methods=['POST'])
@login_requerido
def api_update(ra, tipo):
    data = request.get_json() or {}
    usuario = session.get('usuario')

    conn = get_connection()
    cursor = conn.cursor()

    try:
        if tipo == "contato":
            campos = [
                "email", "celular", "telefone_fixo", "linkedin",
                "nome_emergencia_1", "tel_emergencia_1", "parentesco_emergencia_1",
                "nome_emergencia_2", "tel_emergencia_2", "parentesco_emergencia_2"
            ]
            alteracoes = {k: v for k, v in data.items() if k in campos}
            if alteracoes:
                # UPDATE sempre inclui last_modified_by
                sets = ", ".join([f"{k} = %s" for k in alteracoes.keys()])
                valores = list(alteracoes.values()) + [usuario, ra]
                cursor.execute(
                    f"UPDATE dbo.data_facts_ismart_contato_aluno_v2 "
                    f"SET {sets}, last_modified_by = %s WHERE ra = %s",
                    valores
                )

                # Se não afetou linhas, cria o registro (INSERT)
                if cursor.rowcount == 0:
                    campos_insert = list(alteracoes.keys()) + ["last_modified_by", "ra"]
                    valores_insert = list(alteracoes.values()) + [usuario, ra]
                    placeholders = ", ".join(["%s"] * len(valores_insert))
                    cursor.execute(
                        f"INSERT INTO dbo.data_facts_ismart_contato_aluno_v2 "
                        f"({', '.join(campos_insert)}) VALUES ({placeholders})",
                        valores_insert
                    )

        elif tipo == "endereco":
            campos = ["rua", "numero", "complemento", "cep", "bairro"]
            alteracoes = {k: v for k, v in data.items() if k in campos}
            if alteracoes:
                # UPDATE com last_modified_by
                sets = ", ".join([f"{k} = %s" for k in alteracoes.keys()])
                valores = list(alteracoes.values()) + [usuario, ra]
                cursor.execute(
                    f"UPDATE dbo.data_facts_ismart_endereco_aluno_v2 "
                    f"SET {sets}, last_modified_by = %s WHERE ra = %s",
                    valores
                )

                # Se não afetou linhas, faz INSERT
                if cursor.rowcount == 0:
                    campos_insert = list(alteracoes.keys()) + ["last_modified_by", "ra"]
                    valores_insert = list(alteracoes.values()) + [usuario, ra]
                    placeholders = ", ".join(["%s"] * len(valores_insert))
                    cursor.execute(
                        f"INSERT INTO dbo.data_facts_ismart_endereco_aluno_v2 "
                        f"({', '.join(campos_insert)}) VALUES ({placeholders})",
                        valores_insert
                    )

        conn.commit()
        app.logger.info(f"✅ {tipo.title()} atualizado/inserido para RA {ra} por {usuario}")
        return jsonify({"msg": "Realizado com sucesso!"})

    except Exception as e:
        conn.rollback()
        app.logger.error(f"❌ Erro ao salvar {tipo} (RA={ra}): {e}")
        return jsonify({"msg": f"Erro ao atualizar: {e}"}), 500

# ======================================================
# 🚀 Inicialização
# ======================================================
if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s - %(message)s')
    app.run(debug=True)