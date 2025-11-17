import pymssql
from flask import g
import os

def get_connection():
    if 'conn' not in g:
        g.conn = pymssql.connect(
            server='ismart-sql-server.database.windows.net',
            user='ismart',
            password='Adminsmart!',
            database='dev-ismart-sql-db',
            port=1433
        )
    return g.conn

def close_connection(e=None):
    conn = g.pop('conn', None)
    if conn:
        conn.close()
