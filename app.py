from flask import Flask, render_template, request, redirect, jsonify
import pymssql

app = Flask(__name__)

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
    conn = get_connection()
    cursor = conn.cursor(as_dict=True)
    cursor.execute("""
        SELECT TOP 100 id_contato_aluno, ra, email_ismart, email_pessoal, celular
        FROM data_facts_ismart_contato_aluno
        ORDER BY id_contato_aluno ASC
    """)
    contatos = cursor.fetchall()
    conn.close()
    return render_template('contato_aluno_list.html', contatos=contatos)

@app.route('/contato_aluno/editar/<int:id>', methods=['GET', 'POST'])
def editar_contato(id):
    conn = get_connection()
    cursor = conn.cursor(as_dict=True)
    if request.method == 'POST':
        data = request.form
        cursor.execute("""
            UPDATE contato_aluno
            SET ra=%s, email_ismart=%s, email_pessoal=%s, celular=%s, telefone_fixo=%s,
                linkedin=%s, facebook=%s, instagram=%s,
                nome_emergencia1=%s, tel_emergencia1=%s, parentesco_emergencia1=%s,
                nome_emergencia2=%s, tel_emergencia2=%s, parentesco_emergencia2=%s
            WHERE id_contato_aluno=%s
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
    cursor.execute("SELECT * FROM contato_aluno WHERE id_contato_aluno=%s", (id,))
    contato = cursor.fetchone()
    conn.close()
    return render_template('contato_aluno_edit.html', contato=contato)

@app.route('/contato_aluno/update_ajax/<int:id>', methods=['POST'])
def update_ajax(id):
    data = request.get_json()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE contato_aluno
        SET ra=%s, email_ismart=%s, email_pessoal=%s, celular=%s
        WHERE id_contato_aluno=%s
    """, (data['ra'], data['email_ismart'], data['email_pessoal'], data['celular'], id))
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"})

@app.route('/contato_aluno/search', methods=['GET'])
def buscar_contatos():
    termo = request.args.get('q', '').strip()
    conn = get_connection()
    cursor = conn.cursor(as_dict=True)

    if termo == '':
        # se não tiver filtro, retorna os 100 primeiros
        cursor.execute("""
            SELECT TOP 100 id_contato_aluno, ra, email_ismart, email_pessoal, celular
            FROM data_facts_ismart_contato_aluno
            ORDER BY id_contato_aluno DESC
        """)
    else:
        query = """
            SELECT TOP 100 id_contato_aluno, ra, email_ismart, email_pessoal, celular
            FROM data_facts_ismart_contato_aluno
            WHERE ra LIKE %s
               OR email_ismart LIKE %s
               OR email_pessoal LIKE %s
               OR celular LIKE %s
            ORDER BY id_contato_aluno DESC
        """
        like = f"%{termo}%"
        cursor.execute(query, (like, like, like, like))

    contatos = cursor.fetchall()
    conn.close()
    return jsonify(contatos)

if __name__ == '__main__':
    app.run(debug=True)