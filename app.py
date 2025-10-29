from flask import Flask, render_template, request, redirect, url_for
import pyodbc

app = Flask(__name__)

# conexão com SQL Server
server = 'ismart-sql-server.database.windows.net'
database = 'dev-ismart-sql-db'
username = 'ismart'
password = 'Adminsmart!'
driver = "ODBC Driver 18 for SQL Server"

# Build connection string with SQL authentication
CONNECTION_STRING = (
    f'Driver={{{driver}}};'
    f'Server={server};'
    f'Database={database};'
    f'UID={username};'
    f'PWD={password};'
    'Encrypt=yes;'
    'TrustServerCertificate=no;'
    'Connection Timeout=30;'
    'Login Timeout=15;'
)

# ==========================
# 🏠 Página inicial
# ==========================
@app.route('/')
def home():
    tabelas = [
        {"nome": "contato_aluno", "descricao": "Contatos dos alunos"},
        # você pode adicionar outras aqui no futuro
    ]
    return render_template('index.html', tabelas=tabelas)

# ==========================
# 📋 Listagem de Contatos
# ==========================
@app.route('/contato_aluno')
def listar_contatos():
    conn = pyodbc.connect(CONNECTION_STRING)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id_contato_aluno, ra, email_ismart, email_pessoal, celular
        FROM contato_aluno
    """)
    contatos = [
        {
            "id": r[0],
            "ra": r[1],
            "email_ismart": r[2],
            "email_pessoal": r[3],
            "celular": r[4]
        }
        for r in cursor.fetchall()
    ]
    conn.close()
    return render_template('contato_aluno_list.html', contatos=contatos)

# ==========================
# ➕ Criar novo contato
# ==========================
@app.route('/contato_aluno/novo', methods=['GET', 'POST'])
def novo_contato():
    if request.method == 'POST':
        data = request.form
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO contato_aluno (
                ra, email_ismart, email_pessoal, celular, telefone_fixo,
                linkedin, facebook, instagram,
                nome_emergencia1, tel_emergencia1, parentesco_emergencia1,
                nome_emergencia2, tel_emergencia2, parentesco_emergencia2
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['ra'], data['email_ismart'], data['email_pessoal'],
            data['celular'], data['telefone_fixo'], data['linkedin'],
            data['facebook'], data['instagram'],
            data['nome_emergencia1'], data['tel_emergencia1'], data['parentesco_emergencia1'],
            data['nome_emergencia2'], data['tel_emergencia2'], data['parentesco_emergencia2']
        ))
        conn.commit()
        conn.close()
        return redirect(url_for('listar_contatos'))
    return render_template('contato_aluno_novo.html')

# ==========================
# ✏️ Editar contato
# ==========================
@app.route('/contato_aluno/editar/<int:id>', methods=['GET', 'POST'])
def editar_contato(id):
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    if request.method == 'POST':
        data = request.form
        cursor.execute("""
            UPDATE contato_aluno
            SET ra=?, email_ismart=?, email_pessoal=?, celular=?, telefone_fixo=?,
                linkedin=?, facebook=?, instagram=?,
                nome_emergencia1=?, tel_emergencia1=?, parentesco_emergencia1=?,
                nome_emergencia2=?, tel_emergencia2=?, parentesco_emergencia2=?
            WHERE id_contato_aluno=?
        """, (
            data['ra'], data['email_ismart'], data['email_pessoal'],
            data['celular'], data['telefone_fixo'], data['linkedin'],
            data['facebook'], data['instagram'],
            data['nome_emergencia1'], data['tel_emergencia1'], data['parentesco_emergencia1'],
            data['nome_emergencia2'], data['tel_emergencia2'], data['parentesco_emergencia2'],
            id
        ))
        conn.commit()
        conn.close()
        return redirect(url_for('listar_contatos'))

    cursor.execute("SELECT * FROM contato_aluno WHERE id_contato_aluno=?", id)
    contato = cursor.fetchone()
    conn.close()
    return render_template('contato_aluno_edit.html', contato=contato)

# ==========================
# ❌ Excluir contato
# ==========================
@app.route('/contato_aluno/deletar/<int:id>')
def deletar_contato(id):
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM contato_aluno WHERE id_contato_aluno=?", id)
    conn.commit()
    conn.close()
    return redirect(url_for('listar_contatos'))


if __name__ == '__main__':
    app.run(debug=True)
