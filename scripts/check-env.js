#!/usr/bin/env node

/**
 * 환경 변수 검증 스크립트
 * 배포 전 필수 환경 변수가 설정되어 있는지 확인
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 파일 로드
config({ path: path.join(__dirname, '..', '.env') });

console.log('========================================');
console.log('🔍 환경 변수 검증');
console.log('========================================\n');

const requiredVars = [
  {
    name: 'PUBLIC_SUPABASE_URL',
    description: 'Supabase 프로젝트 URL',
    example: 'https://xxxxx.supabase.co'
  },
  {
    name: 'PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anon/public key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    name: 'PUBLIC_SITE_URL',
    description: '사이트 URL (이메일 인증용)',
    example: 'http://localhost:5173 또는 https://your-domain.com'
  }
];

const optionalVars = [
  {
    name: 'PUBLIC_SUPABASE_DB_URL',
    description: 'Supabase DB URL (보통 PUBLIC_SUPABASE_URL과 동일)',
    example: 'https://xxxxx.supabase.co'
  },
  {
    name: 'PUBLIC_SUPABASE_DB_PUBLIC_KEY',
    description: 'Supabase public key (보통 anon key와 동일)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API 키 (AI 기능 사용 시)',
    example: 'sk-...'
  }
];

let hasErrors = false;
let hasWarnings = false;

console.log('📋 필수 환경 변수:\n');

requiredVars.forEach(varInfo => {
  const value = process.env[varInfo.name];
  const status = value ? '✅' : '❌';
  
  console.log(`${status} ${varInfo.name}`);
  console.log(`   ${varInfo.description}`);
  
  if (value) {
    // 값이 예시 값인지 확인
    if (value.includes('your-') || value.includes('xxxxx')) {
      console.log(`   ⚠️  경고: 예시 값이 설정되어 있습니다`);
      hasWarnings = true;
    } else {
      console.log(`   ✓ 설정됨: ${value.substring(0, 30)}...`);
    }
  } else {
    console.log(`   ✗ 미설정 - 예시: ${varInfo.example}`);
    hasErrors = true;
  }
  console.log('');
});

console.log('📋 선택적 환경 변수:\n');

optionalVars.forEach(varInfo => {
  const value = process.env[varInfo.name];
  const status = value ? '✅' : '⚪';
  
  console.log(`${status} ${varInfo.name}`);
  console.log(`   ${varInfo.description}`);
  
  if (value) {
    if (value.includes('your-') || value.includes('xxxxx')) {
      console.log(`   ⚠️  경고: 예시 값이 설정되어 있습니다`);
      hasWarnings = true;
    } else {
      console.log(`   ✓ 설정됨: ${value.substring(0, 30)}...`);
    }
  } else {
    console.log(`   - 미설정 (선택사항)`);
  }
  console.log('');
});

console.log('========================================');
console.log('📝 검증 결과:');
console.log('========================================\n');

if (hasErrors) {
  console.log('❌ 필수 환경 변수가 설정되지 않았습니다!');
  console.log('   .env.example 파일을 참고하여 .env 파일을 생성하세요.\n');
  console.log('   $ cp .env.example .env\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  경고: 일부 환경 변수가 예시 값으로 설정되어 있습니다.');
  console.log('   실제 값으로 변경하세요.\n');
  process.exit(0);
} else {
  console.log('✅ 모든 필수 환경 변수가 올바르게 설정되었습니다!\n');
  
  // PUBLIC_SITE_URL 환경 확인
  const siteUrl = process.env.PUBLIC_SITE_URL;
  if (siteUrl) {
    if (siteUrl.includes('localhost')) {
      console.log('ℹ️  로컬 개발 환경으로 설정되어 있습니다.');
      console.log('   프로덕션 배포 시 PUBLIC_SITE_URL을 실제 도메인으로 변경하세요.\n');
    } else {
      console.log('ℹ️  프로덕션 환경으로 설정되어 있습니다.');
      console.log(`   사이트 URL: ${siteUrl}\n`);
    }
  }
  
  process.exit(0);
}
