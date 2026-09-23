/**
 * Script de migração direta via PostgreSQL nativo (pg)
 * Executa todas as tabelas, enums, triggers e dados iniciais no Supabase.
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.PGPASSWORD;
  const projectRef = 'apoexnfqbiwmohtqlqgk';

  let client;

  if (dbUrl) {
    console.log('Conectando via DATABASE_URL fornecida...');
    client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });
  } else if (dbPassword) {
    console.log('Conectando via host direto do Supabase com senha...');
    client = new Client({
      host: `db.${projectRef}.supabase.co`,
      port: 5432,
      user: 'postgres',
      password: dbPassword,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
    });
  } else {
    console.error('ERRO: É necessário fornecer a DATABASE_URL ou a senha do banco de dados (SUPABASE_DB_PASSWORD).');
    process.exit(1);
  }

  try {
    await client.connect();
    console.log('Conexão estabelecida com sucesso ao PostgreSQL do Supabase!');

    const sqlPath = path.join(__dirname, '../src/server/db/supabase_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executando migração de DDL e tabelas...');
    await client.query(sql);
    console.log('SUCESSO! Todas as tabelas, restrições e dados foram criados no Supabase!');
  } catch (err) {
    console.error('Falha na execução do SQL:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
