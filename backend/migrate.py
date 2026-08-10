import sqlite3

conn = sqlite3.connect('chefai.db')
cur = conn.cursor()

cur.execute('PRAGMA table_info(users)')
cols = [r[1] for r in cur.fetchall()]
print('Existing columns:', cols)

migrations = {
    'phone':          'ALTER TABLE users ADD COLUMN phone VARCHAR(20)',
    'phone_verified': 'ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT 0',
    'email_verified': 'ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0',
}

for col, sql in migrations.items():
    if col not in cols:
        cur.execute(sql)
        print(f'Added column: {col}')
    else:
        print(f'Already exists: {col}')

conn.commit()
conn.close()
print('Migration complete!')
