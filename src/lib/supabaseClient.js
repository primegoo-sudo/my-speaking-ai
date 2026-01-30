import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

// 환경 변수 검증
if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
  const missingVars = [];
  if (!PUBLIC_SUPABASE_URL) missingVars.push('PUBLIC_SUPABASE_URL');
  if (!PUBLIC_SUPABASE_ANON_KEY) missingVars.push('PUBLIC_SUPABASE_ANON_KEY');
  
  throw new Error(
    `Supabase 환경 변수가 설정되지 않았습니다: ${missingVars.join(', ')}\n` +
    '.env 파일을 생성하고 필수 값들을 설정하세요.\n' +
    '자세한 내용은 README.md를 참조하세요.'
  );
}

// 환경 변수 값 검증 (예시 값인지 확인)
if (PUBLIC_SUPABASE_URL.includes('your-project') || PUBLIC_SUPABASE_ANON_KEY.includes('your-')) {
  console.warn(
    '⚠️  경고: Supabase 환경 변수가 예시 값으로 설정되어 있습니다.\n' +
    '.env 파일에서 실제 Supabase 프로젝트 값으로 변경하세요.'
  );
}

const supabaseClient = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export { supabaseClient }
export default supabaseClient