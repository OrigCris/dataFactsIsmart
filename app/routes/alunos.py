from flask import Blueprint, render_template, request, jsonify, session
from datetime import datetime
from app.utils.db import get_connection
from app.routes.auth import login_requerido

bp_alunos = Blueprint('alunos', __name__)

# ============================================================
# HOME / LISTAGEM
# ============================================================

@bp_alunos.route('/')
@login_requerido
def home():
    conn = get_connection()
    cursor = conn.cursor(as_dict=True)
    cursor.execute('''
        SELECT TOP 100 
            ra, UPPER(nome) AS nome
        FROM dbo.data_facts_ismart_aluno_complemento_v2
        ORDER BY ra ASC
    ''')
    alunos = cursor.fetchall()
    return render_template(
        'index.html',
        alunos=alunos,
        usuario=session['usuario'],
        current_year=datetime.now().year
    )

@bp_alunos.route('/buscar')
@login_requerido
def buscar():
    termo = request.args.get('q', '').strip()
    conn = get_connection()
    cursor = conn.cursor(as_dict=True)

    query_base = '''
        SELECT TOP 100 
            ra, UPPER(nome) AS nome
        FROM dbo.data_facts_ismart_aluno_complemento_v2
    '''

    if termo:
        like = f"%{termo}%"
        cursor.execute(f"{query_base} WHERE ra LIKE %s OR nome LIKE %s ORDER BY ra ASC", (like, like))
    else:
        cursor.execute(f"{query_base} ORDER BY ra ASC")

    alunos = cursor.fetchall()
    return jsonify(alunos)

# ============================================================
# PÁGINAS HTML
# ============================================================

@bp_alunos.route('/aluno/<ra>')
@login_requerido
def aluno_detalhe(ra):
    return render_template(
        'aluno.html',
        ra=ra,
        usuario=session['usuario'],
        current_year=datetime.now().year
    )

# ============================================================
# API — RETORNAR TODOS OS DADOS DO ALUNO
# ============================================================

@bp_alunos.route('/api/aluno/<ra>/all')
@login_requerido
def api_aluno_all(ra):
    conn = get_connection()
    cursor = conn.cursor(as_dict=True)

    # ALUNO COMPLEMENTO
    cursor.execute('''
        select  
            ra, id_raca, id_genero, nome, nome_social, pronome, nome_comunicacao, orientacao_sexual, tamanho_camiseta,
            last_modified_by, ValidFrom
        from data_facts_ismart_aluno_complemento_v2
        WHERE ra = %s
    ''', (ra,))
    aluno_complemento = cursor.fetchone() or {}

    # CONTATO
    cursor.execute('''
        SELECT ra, email, celular, telefone_fixo, linkedin,
               nome_emergencia_1, tel_emergencia_1, parentesco_emergencia_1,
               nome_emergencia_2, tel_emergencia_2, parentesco_emergencia_2,
               last_modified_by, ValidFrom
        FROM dbo.data_facts_ismart_contato_aluno_v2
        WHERE ra = %s
    ''', (ra,))
    contato = cursor.fetchone() or {}

    # ENDEREÇO
    cursor.execute('''
        SELECT ra, rua, numero, complemento, cep, bairro, last_modified_by, ValidFrom
        FROM dbo.data_facts_ismart_endereco_aluno_v2
        WHERE ra = %s
    ''', (ra,))
    endereco = cursor.fetchone() or {}

    # Falta colocar aqui no código do curso
    # last_modified_by,
    # ValidFrom
    # ORDER BY ValidFrom DESC
    # CURSO
    cursor.execute('''
        SELECT TOP 1
            id_localidade_cursos,
            id_cursos_instituicoes,
            id_tempo,
            fonte_atualizacao,
            observacao_atualizacao,
            data_inicio_curso,
            data_prevista_termino_curso,
            data_termino_real,
            ano_cursado_previsto,
            possui_bolsa_faculdade,
            percentual_bolsa_faculdade,
            mensalidade_curso,
            turno_curso,
            periodicidade_curso,
            last_modified_by, ValidFrom
            
        FROM dbo.data_facts_es_informacoes_curso_v2
        WHERE ra = %s
        order by id_informacoes_curso desc
        
    ''', (ra,))
    curso = cursor.fetchone() or {}

    # ORDER BY ValidFrom DESC
    # STATUS
    cursor.execute('''
        SELECT TOP 1 *
        FROM dbo.alumni_status_anual
        WHERE ra = %s
    ''', (ra,))
    status = cursor.fetchone() or {}

    # ORDER BY ValidFrom DESC
    # ALTERAÇÃO STATUS
    cursor.execute('''
        SELECT TOP 1 *
        FROM dbo.ismart_alteracao_status
        WHERE ra = %s
    ''', (ra,))
    alteracao_status = cursor.fetchone() or {}

    return jsonify({
        'contato': contato,
        'endereco': endereco,
        'curso': curso,
        'status': status,
        'alteracao_status': alteracao_status,
        'aluno_complemento': aluno_complemento
    })

# ============================================================
# UPDATE CONTATO / ENDEREÇO
# ============================================================

@bp_alunos.route('/api/aluno/<ra>/<tipo>/update', methods=['POST'])
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
                sets = ", ".join([f"{k} = %s" for k in alteracoes.keys()])
                valores = tuple(alteracoes.values()) + (usuario, ra)

                cursor.execute(
                    f"""
                    UPDATE dbo.data_facts_ismart_contato_aluno_v2
                    SET {sets}, last_modified_by = %s
                    WHERE ra = %s
                    """,
                    valores
                )

                if cursor.rowcount == 0:
                    campos_insert = list(alteracoes.keys()) + ["last_modified_by", "ra"]
                    valores_insert = tuple(alteracoes.values()) + (usuario, ra)
                    placeholders = ", ".join(["%s"] * len(valores_insert))

                    cursor.execute(
                        f"""
                        INSERT INTO dbo.data_facts_ismart_contato_aluno_v2
                        ({', '.join(campos_insert)}) 
                        VALUES ({placeholders})
                        """,
                        valores_insert
                    )

        elif tipo == 'endereco':

            campos = ['rua', 'numero', 'complemento', 'cep', 'bairro']
            alteracoes = {k: v for k, v in data.items() if k in campos}

            if alteracoes:
                sets = ', '.join([f"{k} = %s" for k in alteracoes.keys()])
                valores = tuple(alteracoes.values()) + (usuario, ra)

                cursor.execute(
                    f"""
                    UPDATE dbo.data_facts_ismart_endereco_aluno_v2
                    SET {sets}, last_modified_by = %s
                    WHERE ra = %s
                    """,
                    valores
                )

                if cursor.rowcount == 0:
                    campos_insert = list(alteracoes.keys()) + ['last_modified_by', 'ra']
                    valores_insert = tuple(alteracoes.values()) + (usuario, ra)
                    placeholders = ', '.join(['%s'] * len(valores_insert))

                    cursor.execute(
                        f"""
                        INSERT INTO dbo.data_facts_ismart_endereco_aluno_v2
                        ({', '.join(campos_insert)})
                        VALUES ({placeholders})
                        """,
                        valores_insert
                    )

        conn.commit()
        return jsonify({'msg': 'Realizado com sucesso!'})

    except Exception as e:
        conn.rollback()
        return jsonify({'msg': f'Erro ao atualizar: {e}'}), 500

# ============================================================
# CURSO — INSERT
# ============================================================

@bp_alunos.route('/api/aluno/<ra>/curso/insert', methods=['POST'])
@login_requerido
def api_insert_curso(ra):
    data = request.get_json() or {}
    usuario = session.get("usuario")

    campos = [
        "id_localidade_cursos", "id_cursos_instituicoes", "id_tempo",
        "fonte_atualizacao", "observacao_atualizacao",
        "data_inicio_curso", "data_prevista_termino_curso", "data_termino_real",
        "ano_cursado_previsto", "possui_bolsa_faculdade", "percentual_bolsa_faculdade",
        "mensalidade_curso", "turno_curso", "periodicidade_curso", "informacoes_contrato"
    ]

    valores = [data.get(c) for c in campos]

    conn = get_connection()
    cursor = conn.cursor()

    try:
        placeholders = ", ".join(["%s"] * (len(campos) + 2))

        cursor.execute(
            f"""
            INSERT INTO dbo.data_facts_es_informacoes_curso_v2
            ({', '.join(campos)}, last_modified_by, ra)
            VALUES ({placeholders})
            """,
            tuple(valores) + (usuario, ra,)
        )

        conn.commit()
        return jsonify({"msg": "Curso inserido com sucesso!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"msg": f"Erro ao inserir curso: {e}"}), 500

# ============================================================
# CURSO — UPDATE (somente o último registro!)
# ============================================================

# @bp_alunos.route('/api/aluno/<ra>/curso/update', methods=['POST'])
# @login_requerido
# def api_update_curso(ra):
#     data = request.get_json() or {}
#     usuario = session.get("usuario")

#     campos = [
#         "id_localidade_cursos", "id_cursos_instituicoes", "id_tempo",
#         "fonte_atualizacao", "observacao_atualizacao",
#         "data_inicio_curso", "data_prevista_termino_curso", "data_termino_real",
#         "ano_cursado_previsto", "percentual_bolsa_faculdade",
#         "mensalidade_curso", "turno_curso", "periodicidade_curso"
#     ]

#     alteracoes = {k: v for k, v in data.items() if k in campos}
#     if not alteracoes:
#         return jsonify({"msg": "Nada para atualizar."}), 400

#     sets = ", ".join([f"{k} = %s" for k in alteracoes.keys()])
#     valores = tuple(alteracoes.values()) + (usuario, ra)

#     conn = get_connection()
#     cursor = conn.cursor()

#     try:
#         cursor.execute(
#             f"""
#             UPDATE dbo.data_facts_es_informacoes_curso_v2
#             SET {sets}, last_modified_by = %s
#             WHERE ra = %s
#             AND id_informacoes_curso = (
#                 SELECT MAX(id_informacoes_curso)
#                 FROM dbo.data_facts_es_informacoes_curso_v2
#                 WHERE ra = %s
#             )
#             """,
#             valores + (ra,)
#         )

#         if cursor.rowcount == 0:
#             return jsonify({"msg": "Nenhum curso encontrado para atualizar."}), 404

#         conn.commit()
#         return jsonify({"msg": "Curso atualizado com sucesso!"})

#     except Exception as e:
#         conn.rollback()
#         return jsonify({"msg": f"Erro ao atualizar curso: {e}"}), 500

# ============================================================
# Aluno Complemento — UPDATE
# ============================================================

@bp_alunos.route('/api/aluno/<ra>/aluno_cmp/update', methods=['POST'])
@login_requerido
def api_update_aluno_cmp(ra):
    data = request.get_json() or {}
    usuario = session.get("usuario")

    campos = [
        "id_raca", "id_genero", "nome","nome_social", "pronome",
        "nome_comunicacao", "orientacao_sexual", "tamanho_camiseta"
    ]

    alteracoes = {k: v for k, v in data.items() if k in campos}
    sets = ", ".join([f"{k} = %s" for k in alteracoes.keys()])
    valores = tuple(alteracoes.values()) + (usuario, ra)

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            f"""
            UPDATE dbo.data_facts_ismart_aluno_complemento_v2
            SET {sets}, last_modified_by = %s
            WHERE ra = %s
            """,
            valores + (ra,)
        )

        conn.commit()
        return jsonify({"msg": "Aluno atualizado com sucesso!"})

    except Exception as e:
        conn.rollback()
        return jsonify({"msg": f"Erro ao atualizar os dados do aluno: {e}"}), 500

# ============================================================
# STATUS — UPDATE
# ============================================================

@bp_alunos.route('/api/aluno/<ra>/status/update', methods=['POST'])
@login_requerido
def api_update_status(ra):
    data = request.get_json() or {}
    usuario = session.get("usuario")

    id_status = data.get("id_status")
    if id_status is None:
        return jsonify({"msg": "Campo id_status é obrigatório"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE dbo.alumni_status_anual
            SET id_status = %s, last_modified_by = %s
            WHERE ra = %s
        """, (id_status, usuario, ra))

        if cursor.rowcount == 0:
            cursor.execute("""
                INSERT INTO dbo.alumni_status_anual
                (id_status, ra, last_modified_by)
                VALUES (%s, %s, %s)
            """, (id_status, ra, usuario))

        conn.commit()
        return jsonify({"msg": "Status atualizado com sucesso!"})

    except Exception as e:
        conn.rollback()
        return jsonify({"msg": f"Erro ao atualizar status: {e}"}), 500

# ============================================================
# ALTERAÇÃO STATUS — INSERT
# ============================================================

@bp_alunos.route('/api/aluno/<ra>/alteracao_status/insert', methods=['POST'])
@login_requerido
def api_insert_alteracao_status(ra):
    data = request.get_json() or {}
    usuario = session.get("usuario")

    observacao = data.get("observacao")
    data_alteracao = data.get("data_alteracao")

    hoje = datetime.now()
    id_tempo = int(f"{hoje.year}{str(hoje.month).zfill(2)}")

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO dbo.ismart_alteracao_status
            (id_tempo, fonte, observacao, data_alteracao, ra, last_modified_by)
            VALUES (%s, 'Front', %s, %s, %s, %s)
        """, (id_tempo, observacao, data_alteracao, ra, usuario))

        conn.commit()
        return jsonify({"msg": "Alteração de status registrada com sucesso!"})

    except Exception as e:
        conn.rollback()
        return jsonify({"msg": f"Erro ao inserir alteração: {e}"}), 500
    

# NOVAS ROTAS TABELA AUX

@bp_alunos.route("/api/curso/tabelas")
@login_requerido
def curso_tabelas():

    conn = get_connection()
    cursor = conn.cursor(as_dict=True)

    # Localidades
    cursor.execute("""
        SELECT id_localidade_cursos, cidade, estado, pais
        FROM data_facts_ismart_localidade_cursos
        ORDER BY cidade
    """)
    localidades = cursor.fetchall()

    # Cursos + instituições
    cursor.execute("""
        SELECT id_cursos_instituicoes, nome_curso, instituicao
        FROM ismart_cursos_instituicoes
        ORDER BY nome_curso
    """)
    cursos = cursor.fetchall()

     # Cursos + instituições
    cursor.execute("""
        select * from ismart_raca
    """)
    raca = cursor.fetchall()

     # Cursos + instituições
    cursor.execute("""
        select * from ismart_genero
    """)
    genero = cursor.fetchall()

    return jsonify({
        "localidades": localidades,
        "cursos": cursos,
        "raca": raca,
        "genero": genero
    })