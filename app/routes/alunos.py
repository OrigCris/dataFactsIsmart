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
        select TOP 100 aluno.ra, upper(nome) as nome 
        from dbo.data_facts_ismart_aluno_complemento_v2 aluno
        inner join (
            select distinct ra from ismart_matricula
            where id_tempo = (select max(id_tempo) from ismart_matricula) and id_projeto in (3,4)
        ) aux
            on aluno.ra = aux.ra
        ORDER BY aluno.ra ASC
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
        select TOP 100 aluno.ra, upper(nome) as nome 
        from dbo.data_facts_ismart_aluno_complemento_v2 aluno
        inner join (
            select distinct ra from ismart_matricula
            where id_tempo = (select max(id_tempo) from ismart_matricula) and id_projeto in (3,4)
        ) aux
            on aluno.ra = aux.ra
    '''

    if termo:
        like = f"%{termo}%"
        cursor.execute(f"{query_base} WHERE aluno.ra LIKE %s OR nome LIKE %s ORDER BY aluno.ra ASC", (like, like))
    else:
        cursor.execute(f"{query_base} ORDER BY aluno.ra ASC")

    alunos = cursor.fetchall()
    return jsonify(alunos)

# ============================================================
# PÁGINAS HTML
# ============================================================

@bp_alunos.route('/aluno/<ra>')
@login_requerido
def aluno_detalhe(ra):
    conn = get_connection()
    cursor = conn.cursor(as_dict=True)

    # Verifica se o RA está na "matrícula atual" do projeto 4
    cursor.execute("""
        WITH
        base as (
        SELECT ra, sum(case when id_projeto = 3 then 1 end) as qt_univ, sum(case when id_projeto = 4 then 1 end) as qt_alumni
                FROM ismart_matricula
                WHERE id_tempo = (SELECT MAX(id_tempo) FROM ismart_matricula) 
                group by ra
        )
        select 1 as in_alumni from base where qt_alumni = 1 and ra = %s
    """, (ra,))

    in_alumni = cursor.fetchone() is not None

    cursor.execute("""
        WITH
        base as (
        SELECT ra, sum(case when id_projeto = 3 then 1 end) as qt_univ, sum(case when id_projeto = 4 then 1 end) as qt_alumni
                FROM ismart_matricula
                WHERE id_tempo = (SELECT MAX(id_tempo) FROM ismart_matricula) 
                group by ra
        )
        select 1 as in_univ from base where qt_univ = 1 and qt_alumni is null and ra = %s
    """, (ra,))

    in_univ = cursor.fetchone() is not None
    
    return render_template(
        'aluno.html',
        ra=ra,
        tem_status_atual=in_alumni,
        tem_status_mensal=in_univ,
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

    cursor.execute('''
        SELECT TOP 1
            id_localidade_cursos,
            id_cursos_instituicoes,
            FORMAT(CURRENT_TIMESTAMP, 'yyyyMM') as id_tempo,
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
        order by id_tempo desc, id_informacoes_curso desc
    ''', (ra,))
    curso = cursor.fetchone() or {}
    
    # STATUS ALUMNI
    cursor.execute('''
        SELECT TOP 1 ra, id_status, id_tempo, last_modified_by, ValidFrom
        FROM dbo.alumni_status_anual_v2
        WHERE ra = %s 
        order by id_tempo desc, id_al_status_anual desc
    ''', (ra,))
    status = cursor.fetchone() or {}

    # ALTERAÇÃO STATUS
    cursor.execute('''
        SELECT TOP 1 ra, observacao, data_alteracao, last_modified_by, ValidFrom
        FROM dbo.ismart_alteracao_status_v2
        WHERE ra = %s 
        order by id_tempo desc
    ''', (ra,))
    alteracao_status = cursor.fetchone() or {}

    # STATUS MENSAL
    cursor.execute('''
        SELECT TOP 1 ra, id_status, id_tempo, last_modified_by, ValidFrom
        FROM dbo.ismart_status_mensal_v2
        WHERE ra = %s
        ORDER BY ID_TEMPO DESC
    ''', (ra,))
    status_mensal = cursor.fetchone() or {}

    # ES STATUS META MENSAL
    cursor.execute('''
        select TOP 1 
            ra, id_es_status_meta, id_esal_status_oportunidade, top_empresa, id_tempo, last_modified_by, ValidFrom
        from es_status_meta_mensal_v2 
        where ra = %s
        order by id_tempo desc
    ''', (ra,))
    es_status_meta_mensal = cursor.fetchone() or {}

    return jsonify({
        'contato': contato,
        'endereco': endereco,
        'curso': curso,
        'status': status,
        'alteracao_status': alteracao_status,
        'aluno_complemento': aluno_complemento,
        'status_mensal': status_mensal,
        'es_status_meta_mensal': es_status_meta_mensal
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

    in_transf = 0

    if data.get('id_cursos_instituicoes_antigo'):
        if int(data.get('id_cursos_instituicoes_antigo')) != int(data.get('id_cursos_instituicoes')):
            in_transf = 1

    conn = get_connection()
    cursor = conn.cursor()

    try:
        placeholders = ", ".join(["%s"] * (len(campos) + 3))

        cursor.execute(
            f"""
            INSERT INTO dbo.data_facts_es_informacoes_curso_v2
            ({', '.join(campos)}, transferencia, last_modified_by, ra)
            VALUES ({placeholders})
            """,
            tuple(valores) + (in_transf, usuario, ra,)
        )

        conn.commit()
        return jsonify({"msg": "Curso inserido com sucesso!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"msg": f"Erro ao inserir curso: {e}"}), 500

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
# STATUS ANUAL — UPDATE OR INSERT
# ============================================================

@bp_alunos.route('/api/aluno/<ra>/status/update', methods=['POST'])
@login_requerido
def api_update_status(ra):
    data = request.get_json() or {}
    usuario = session.get("usuario")

    id_status = data.get("id_status")
    id_tempo = data.get("id_tempo")
    if id_status is None:
        return jsonify({"msg": "Campo id_status é obrigatório"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE dbo.alumni_status_anual_v2
            SET id_status = %s, last_modified_by = %s
            WHERE ra = %s and id_tempo = %s
        """, (id_status, usuario, ra, id_tempo))

        if cursor.rowcount == 0:
            cursor.execute("""
                INSERT INTO dbo.alumni_status_anual_v2
                (id_status, ra, last_modified_by)
                VALUES (%s, %s, %s)
            """, (id_status, ra, usuario))

        conn.commit()
        return jsonify({"msg": "Status atualizado com sucesso!"})

    except Exception as e:
        conn.rollback()
        return jsonify({"msg": f"Erro ao atualizar status: {e}"}), 500

# ============================================================
# STATUS MENSAL — UPDATE
# ============================================================

@bp_alunos.route('/api/aluno/<ra>/status_mensal/update', methods=['POST'])
@login_requerido
def api_update_status_mensal(ra):
    data = request.get_json() or {}
    usuario = session.get("usuario")

    id_status = data.get("id_status")
    id_tempo = data.get("id_tempo")
    if id_status is None:
        return jsonify({"msg": "Campo id_status é obrigatório"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE dbo.ismart_status_mensal_v2
            SET id_status = %s, last_modified_by = %s
            WHERE ra = %s and id_tempo = %s
        """, (id_status, usuario, ra, id_tempo))

        conn.commit()
        return jsonify({"msg": "Status Mensal atualizado com sucesso!"})

    except Exception as e:
        conn.rollback()
        return jsonify({"msg": f"Erro ao atualizar Status Mensal: {e}"}), 500

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
            INSERT INTO dbo.ismart_alteracao_status_v2
            (id_tempo, fonte, observacao, data_alteracao, ra, last_modified_by)
            VALUES (%s, 'Front', %s, %s, %s, %s)
        """, (id_tempo, observacao, data_alteracao, ra, usuario))

        conn.commit()
        return jsonify({"msg": "Alteração de status registrada com sucesso!"})

    except Exception as e:
        conn.rollback()
        return jsonify({"msg": f"Erro ao inserir alteração: {e}"}), 500
    
# ============================================================
# ES STATUS META MENSAL — UPDATE
# ============================================================

@bp_alunos.route('/api/aluno/<ra>/es_status_meta_mensal/update', methods=['POST'])
@login_requerido
def api_update_es_status_meta_mensal(ra):
    data = request.get_json() or {}
    usuario = session.get("usuario")

    id_es_status_meta = data.get("id_es_status_meta")
    id_esal_status_oportunidade = data.get("id_esal_status_oportunidade")
    top_empresa = data.get("top_empresa")
    id_tempo = data.get("id_tempo")

    if id_es_status_meta is None:
        return jsonify({"msg": "Campo id_status é obrigatório"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE dbo.es_status_meta_mensal_v2
            SET id_es_status_meta = %s, id_esal_status_oportunidade = %s, top_empresa = %s, last_modified_by = %s
            WHERE ra = %s and id_tempo = %s
        """, (id_es_status_meta, id_esal_status_oportunidade, top_empresa, usuario, ra, id_tempo))

        conn.commit()
        return jsonify({"msg": "ES Status Meta Mensal atualizado com sucesso!"})

    except Exception as e:
        conn.rollback()
        return jsonify({"msg": f"Erro ao atualizar ES Status Meta Mensal: {e}"}), 500

# ============================================================
# REGISTRO OPORTUNIDADE — INSERT
# ============================================================

@bp_alunos.route('/api/aluno/<ra>/reg_oportunidade/insert', methods=['POST'])
@login_requerido
def api_insert_reg_oportunidade(ra):
    data = request.get_json() or {}
    usuario = session.get("usuario")

    campos = [
        'id_esal_nivel_oportunidade', 'id_esal_status_oportunidade', 'fonte_atualizacao', 'cargo_oportunidade', 'principais_responsabilidades'
        ,'area_oportunidade', 'setor_oportunidade', 'nome_organizacao', 'site_organizacao', 'inicio_oportunidade'
        ,'termino_oportunidade', 'remuneracao', 'moeda_remuneracao', 'indicacao_ismart', 'top_empresa'
        ,'empresa_parceira', 'id_tempo'
    ]

    # Somente os campos enviados no JSON e que existem na tabela
    alteracoes = {k: v for k, v in data.items() if k in campos}

    # Lista de valores (na mesma ordem)
    valores = [alteracoes.get(c) for c in campos]

    # Adiciona RA e usuário no final
    valores.append(ra)
    valores.append(usuario)

    # Transforma em TUPLA ✔
    valores = tuple(valores)

    # Criação dos placeholders (%s)
    placeholders = ", ".join(["%s"] * (len(campos) + 2))

    hoje = datetime.now()
    id_tempo = int(f"{hoje.year}{str(hoje.month).zfill(2)}")

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(f"""
            INSERT INTO dbo.data_facts_esal_registros_oportunidades_v2
            (
                {', '.join(campos)}, ra, last_modified_by
            )
            VALUES ({placeholders})
        """, valores)

        conn.commit()
        return jsonify({"msg": "Registro de oportunidade inserido com sucesso!"})

    except Exception as e:
        conn.rollback()
        return jsonify({"msg": f"Erro ao inserir oportunidade: {e}"}), 500

# NOVAS ROTAS TABELA AUX

@bp_alunos.route("/api/tabelas_auxiliares")
@login_requerido
def tabelas_auxiliares():

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

    cursor.execute("""
        select * from ismart_status where id_status in (1, 6)
    """)
    status_alumni_dp = cursor.fetchall()

    cursor.execute("""
        select * from ismart_status where id_status in (2,7,9,10,11)
    """)
    status_mensal_dp = cursor.fetchall()

    cursor.execute("""
        select * from es_status_meta
    """)
    es_status_meta_dp = cursor.fetchall()

    cursor.execute("""
        select * from esal_status_oportunidade
    """)
    es_status_oport_dp = cursor.fetchall()


    return jsonify({
        "localidades": localidades,
        "cursos": cursos,
        "raca": raca,
        "genero": genero,
        "status_alumni_dp": status_alumni_dp,
        "status_mensal_dp": status_mensal_dp,
        "es_status_meta_dp": es_status_meta_dp,
        "es_status_oport_dp": es_status_oport_dp
    })