import pymssql
from flask import g
import os

def get_connection():
    if 'conn' not in g:
        g.conn = pymssql.connect(
            server=os.getenv('DB_SERVER'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            database=os.getenv('DB_NAME'),
            port=1433
        )
    return g.conn

def close_connection(e=None):
    conn = g.pop('conn', None)
    if conn:
        conn.close()
