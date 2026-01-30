#!/usr/bin/env node

/**
 * 데이터베이스 마이그레이션 도우미 스크립트
 * Supabase에서 실행할 SQL 파일들을 출력합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlDir = path.join(__dirname, '..', 'sql');

console.log('========================================');
console.log('📊 데이터베이스 마이그레이션 가이드');
console.log('========================================\n');

console.log('Supabase SQL Editor에서 다음 파일들을 순서대로 실행하세요:\n');

// SQL 파일 목록
const sqlFiles = [
  {
    file: 'create_users_table.sql',
    description: '사용자 프로필 테이블 생성 (필수)',
    priority: 1
  },
  {
    file: 'create_test_table.sql',
    description: '테스트 테이블 생성 (선택)',
    priority: 2
  }
];

sqlFiles.sort((a, b) => a.priority - b.priority);

sqlFiles.forEach((item, index) => {
  const filePath = path.join(sqlDir, item.file);
  console.log(`${index + 1}. ${item.file}`);
  console.log(`   ${item.description}`);
  
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ 파일 존재: ${filePath}`);
  } else {
    console.log(`   ✗ 파일 없음: ${filePath}`);
  }
  console.log('');
});

console.log('========================================');
console.log('🔗 Supabase SQL Editor 접속 방법:');
console.log('========================================\n');
console.log('1. https://app.supabase.com 로그인');
console.log('2. 프로젝트 선택');
console.log('3. 좌측 메뉴에서 "SQL Editor" 클릭');
console.log('4. "New query" 클릭');
console.log('5. 위 SQL 파일의 내용을 복사하여 붙여넣기');
console.log('6. "Run" 버튼 클릭\n');

console.log('========================================');
console.log('✅ 마이그레이션 확인 쿼리:');
console.log('========================================\n');

const verificationQueries = `
-- 1. users 테이블 존재 확인
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- 2. RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'users';

-- 3. 트리거 확인
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 4. 등록된 사용자 확인
SELECT id, email, name, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;
`;

console.log(verificationQueries);

console.log('========================================');
console.log('📝 참고사항:');
console.log('========================================\n');
console.log('- SQL 파일은 한 번만 실행하면 됩니다');
console.log('- 이미 실행했다면 "CREATE EXTENSION" 에러는 무시 가능');
console.log('- 트리거는 회원가입 시 자동으로 public.users 생성');
console.log('- 문제 발생 시 DEPLOYMENT.md 참조\n');

console.log('자세한 내용은 README.md와 DEPLOYMENT.md를 참조하세요.\n');
