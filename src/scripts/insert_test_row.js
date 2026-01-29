import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_DB_URL;
const SUPABASE_KEY = process.env.PUBLIC_SUPABASE_DB_SERVICE_ROLE || process.env.PUBLIC_SUPABASE_DB_PUBLIC_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[insert_test_row] Missing PUBLIC_SUPABASE_DB_URL or SERVICE_ROLE/ANON key in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  try {
    const payload = {
      name: 'test-row',
      description: 'Inserted by insert_test_row.js',
      metadata: { created_by: 'local-script' }
    };

    const { data, error } = await supabase.from('test_items').insert(payload).select();

    if (error) {
      console.error('Insert error:', error);
      process.exit(1);
    }

    console.log('Inserted row:', data);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

run();
