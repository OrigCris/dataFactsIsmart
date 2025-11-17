from app import create_app
from app.utils.db import close_connection

app = create_app()

@app.teardown_appcontext
def teardown(e):
    close_connection(e)

if __name__ == '__main__':
    app.run(debug=True)
