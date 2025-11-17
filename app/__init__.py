from flask import Flask
from dotenv import load_dotenv
from pathlib import Path
import os, logging

def create_app():
    # 🔥 Carrega o .env do local CORRETO, independente de onde o Python for iniciado
    env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(dotenv_path=env_path, override=True)

    app = Flask(__name__,
                static_folder='static',
                template_folder='templates')

    app.secret_key = 'super-secret'
    app.config['PERMANENT_SESSION_LIFETIME'] = 1800  # 30 min

    # Logging
    os.makedirs('app/logs', exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format='[%(asctime)s] %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('app/logs/app.log', encoding='utf-8'),
            logging.StreamHandler()
        ]
    )

    # Blueprints
    from app.routes.alunos import bp_alunos
    from app.routes.auth import bp_auth
    app.register_blueprint(bp_auth)
    app.register_blueprint(bp_alunos)

    return app