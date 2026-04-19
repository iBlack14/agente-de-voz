require('dotenv').config();
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Configuración OLD POSTGRES (Extraída de la línea 45 del .env)
const oldDbConfig = "postgresql://postgres:f0hmve3ZgLZyplZoUv3DVWvob4WK3WHr@158.220.120.241:5432/postgres";

// Configuración SUPABASE
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    const client = new Client({ connectionString: oldDbConfig });
    
    try {
        console.log('🔄 Conectando a PostgreSQL viejo...');
        await client.connect();
        console.log('✅ Conectado.');

        // 1. Migrar PROMPTS
        console.log('📦 Extrayendo PROMPTS...');
        const promptsRes = await client.query('SELECT * FROM prompts');
        console.log(`🔍 Encontrados ${promptsRes.rows.length} prompts.`);
        
        for (const row of promptsRes.rows) {
            const { error } = await supabase.from('prompts').upsert({
                id: row.id,
                name: row.name,
                greeting: row.greeting,
                text: row.text,
                created_at: row.created_at
            });
            if (error) console.error(`❌ Error migrando prompt ${row.id}:`, error.message);
            else console.log(`✅ Prompt migrado: ${row.name}`);
        }

        // 2. Migrar REMINDER_PROMPTS
        console.log('📦 Extrayendo RECORDATORIOS...');
        const remindersRes = await client.query('SELECT * FROM reminder_prompts');
        console.log(`🔍 Encontrados ${remindersRes.rows.length} recordatorios.`);
        
        for (const row of remindersRes.rows) {
            const { error } = await supabase.from('reminder_prompts').upsert({
                id: row.id,
                name: row.name,
                greeting: row.greeting,
                text: row.text,
                created_at: row.created_at
            });
            if (error) console.error(`❌ Error migrando recordatorio ${row.id}:`, error.message);
            else console.log(`✅ Recordatorio migrado: ${row.name}`);
        }

        // 3. Migrar APP_SETTINGS
        console.log('📦 Extrayendo CONFIGURACIÓN...');
        const settingsRes = await client.query('SELECT * FROM app_settings');
        for (const row of settingsRes.rows) {
            await supabase.from('app_settings').upsert({
                key: row.key,
                value: row.value
            });
        }
        console.log('✅ Configuración migrada.');

        console.log('\n✨ ¡MIGRACIÓN COMPLETADA CON ÉXITO! ✨');
        console.log('Tus datos antiguos ya están en Supabase.');

    } catch (e) {
        console.error('💥 ERROR CRÍTICO DURANTE LA MIGRACIÓN:', e.message);
    } finally {
        await client.end();
    }
}

migrate();
