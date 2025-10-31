from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from functools import wraps
from datetime import datetime, timedelta
import pymssql

app = Flask(__name__)
app.secret_key = 'chave-super-secreta'  # troque depois!
app.permanent_session_lifetime = timedelta(minutes=30)

# conexão com SQL Server
server = 'ismart-sql-server.database.windows.net'
database = 'dev-ismart-sql-db'
username = 'ismart'
password = 'Adminsmart!'

def get_connection():
    return pymssql.connect(
        server=server,
        user=username,
        password=password,
        database=database,
        port=1433
    )

# ======================================================
# 🔒 Decorator para exigir login
# ======================================================
def login_requerido(f):
    @wraps(f)
    def decorador(*args, **kwargs):
        if 'usuario' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorador

# ======================================================
# 🧠 Credenciais fixas para teste (usuário: senha)
# ======================================================
USUARIOS_FIXOS = {
    "admin": "ismart",
    "elson": "ismart",
    "fulano": "ismart",
    "ciclano": "ismart"
}

# ======================================================
# 🔐 Rotas de login/logout
# ======================================================
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        usuario = request.form['usuario']
        senha = request.form['senha']

        # 🔒 Verifica se o usuário existe e a senha confere
        if usuario in USUARIOS_FIXOS and USUARIOS_FIXOS[usuario] == senha:
            session['usuario'] = usuario
            session.permanent = True
            return redirect(url_for('home'))
        else:
            return render_template('login.html', erro="Usuário ou senha incorretos.")

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('usuario', None)
    return redirect(url_for('login'))

# ==========================
# 🏠 Página inicial
# ==========================
@app.route('/')
@login_requerido
def home():
    tabelas = [
        {"nome": "contato_aluno", "descricao": "Contatos dos alunos"},
        {"nome": "#", "descricao": "Endereço dos alunos"},
        {"nome": "#", "descricao": "Ficha dos alunos"},
        # você pode adicionar outras aqui no futuro
    ]
    return render_template('index.html', tabelas=tabelas, current_year=datetime.now().year)

# ==========================
# 📋 Listagem de Contatos
# ==========================
@app.route('/contato_aluno')
@login_requerido
def listar_contatos():
    conn = get_connection()
    cursor = conn.cursor(as_dict=True)
    cursor.execute("""
        SELECT TOP 100
            id_contato_aluno,
            ra,
            email_ismart,
            email_pessoal,
            celular,
            telefone_fixo,
            linkedin,
            facebook,
            instagram,
            nome_emergencia1,
            tel_emergencia1,
            parentesco_emergencia1,
            nome_emergencia2,
            tel_emergencia2,
            parentesco_emergencia2,
            last_modified_by,
            ValidFrom
        FROM dbo.vw_contato_aluno_br
        ORDER BY id_contato_aluno ASC
    """)
    contatos = cursor.fetchall()
    conn.close()
    return render_template('contato_aluno_list.html', contatos=contatos)

@app.route('/contato_aluno/update_ajax/<int:id>', methods=['POST'])
@login_requerido
def update_ajax(id):
    data = request.get_json()
    usuario = session.get('usuario', 'desconhecido')

    # 🔧 Converte strings vazias em None (NULL no SQL)
    for key, value in data.items():
        if isinstance(value, str) and value.strip() == '':
            data[key] = None

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE dbo.data_facts_ismart_contato_aluno_v2
        SET 
            ra = %s,
            email_ismart = %s,
            email_pessoal = %s,
            celular = %s,
            telefone_fixo = %s,
            linkedin = %s,
            facebook = %s,
            instagram = %s,
            nome_emergencia1 = %s,
            tel_emergencia1 = %s,
            parentesco_emergencia1 = %s,
            nome_emergencia2 = %s,
            tel_emergencia2 = %s,
            parentesco_emergencia2 = %s,
            last_modified_by = %s
        WHERE id_contato_aluno = %s
    """, (
        data.get('ra'),
        data.get('email_ismart'),
        data.get('email_pessoal'),
        data.get('celular'),
        data.get('telefone_fixo'),
        data.get('linkedin'),
        data.get('facebook'),
        data.get('instagram'),
        data.get('nome_emergencia1'),
        data.get('tel_emergencia1'),
        data.get('parentesco_emergencia1'),
        data.get('nome_emergencia2'),
        data.get('tel_emergencia2'),
        data.get('parentesco_emergencia2'),
        usuario,
        id
    ))
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"})

@app.route('/contato_aluno/search', methods=['GET'])
def buscar_contatos():
    termo = request.args.get('q', '').strip()
    conn = get_connection()
    cursor = conn.cursor(as_dict=True)

    if termo == '':
        cursor.execute("""
            SELECT TOP 100
                id_contato_aluno,
                ra,
                email_ismart,
                email_pessoal,
                celular,
                telefone_fixo,
                linkedin,
                facebook,
                instagram,
                nome_emergencia1,
                tel_emergencia1,
                parentesco_emergencia1,
                nome_emergencia2,
                tel_emergencia2,
                parentesco_emergencia2,
                last_modified_by,
                ValidFrom
            FROM dbo.vw_contato_aluno_br
            ORDER BY id_contato_aluno ASC
        """)
    else:
        query = """
            SELECT TOP 100
                id_contato_aluno,
                ra,
                email_ismart,
                email_pessoal,
                celular,
                telefone_fixo,
                linkedin,
                facebook,
                instagram,
                nome_emergencia1,
                tel_emergencia1,
                parentesco_emergencia1,
                nome_emergencia2,
                tel_emergencia2,
                parentesco_emergencia2,
                last_modified_by,
                ValidFrom
            FROM dbo.vw_contato_aluno_br
            WHERE ra LIKE %s
               OR email_ismart LIKE %s
               OR email_pessoal LIKE %s
               OR celular LIKE %
               OR last_modified_by LIKE %s
            ORDER BY id_contato_aluno ASC
        """
        like = f"%{termo}%"
        cursor.execute(query, (like, like, like, like, like))

    contatos = cursor.fetchall()
    conn.close()
    return jsonify(contatos)

if __name__ == '__main__':
    app.run(debug=True)