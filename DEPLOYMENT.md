# 배포 체크리스트

프로덕션 배포 전 반드시 확인해야 할 항목들입니다.

## 🔧 환경 변수 설정

### Vercel 환경 변수

Vercel 대시보드 > Project Settings > Environment Variables에서 다음 변수들을 설정하세요:

- [x] `PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- [x] `PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- [x] `PUBLIC_SUPABASE_DB_URL` - Supabase DB URL (보통 PUBLIC_SUPABASE_URL과 동일)
- [x] `PUBLIC_SUPABASE_DB_PUBLIC_KEY` - Supabase public key (보통 anon key와 동일)
- [x] `PUBLIC_SITE_URL` - 프로덕션 도메인 (예: https://my-speaking-ai.vercel.app)
- [x] `OPENAI_API_KEY` - OpenAI API 키 (선택사항)

### 로컬 .env 파일

프로덕션 배포 전 로컬 테스트를 위해:

```bash
# .env 파일에서 PUBLIC_SITE_URL을 프로덕션 URL로 임시 변경
PUBLIC_SITE_URL=https://your-production-domain.com
```

테스트 후 다시 로컬 URL로 변경하는 것을 잊지 마세요.

## 📊 데이터베이스 설정

### Supabase SQL 마이그레이션

- [x] `sql/create_users_table.sql` 실행 완료
- [x] RLS (Row Level Security) 정책 활성화 확인
- [x] 트리거 함수 정상 작동 확인

### 데이터베이스 테스트

Supabase SQL Editor에서 다음 쿼리로 확인:

```sql
-- 트리거 확인
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- 테스트 사용자 확인
SELECT id, email, name, created_at FROM public.users LIMIT 10;
```

## 🔐 Supabase 인증 설정

### Authentication Settings

1. **Supabase Dashboard > Authentication > Settings**

- [x] Email 인증 활성화
- [x] Enable email confirmations 체크
- [x] Secure email change 활성화 (권장)

### Redirect URLs

2. **Supabase Dashboard > Authentication > URL Configuration**

다음 URL들을 추가:

- [x] `http://localhost:5173/auth/callback` (로컬 개발용)
- [x] `https://your-production-domain.com/auth/callback` (프로덕션)

### Email Templates

3. **Supabase Dashboard > Authentication > Email Templates**

- [x] Confirm signup 템플릿 확인
- [x] 이메일 템플릿의 리다이렉트 URL에 `{{ .ConfirmationURL }}` 포함 확인

## 🚀 배포 전 테스트

### 로컬 환경에서 프로덕션 빌드 테스트

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 프리뷰
npm run preview
```

### 기능 테스트

- [x] 회원가입 flow
  - 이메일/비밀번호 입력
  - 비밀번호 강도 검증 확인
  - 이메일 인증 안내 메시지 확인
  
- [x] 이메일 인증
  - 인증 이메일 수신 확인
  - 인증 링크 클릭 시 `/auth/callback` 정상 작동
  - 인증 완료 후 `/practice`로 리다이렉트
  
- [x] 로그인 flow
  - 정상 로그인
  - 잘못된 비밀번호 에러 처리
  - 이메일 미확인 사용자 에러 처리
  
- [x] 데이터베이스 확인
  - public.users 테이블에 사용자 정보 저장 확인
  - auth.users와 public.users 동기화 확인

## 🔍 배포 후 확인사항

### 1. 첫 배포 직후

```bash
# Vercel 배포
vercel --prod

# 배포 완료 후 받은 URL 확인
# 예: https://my-speaking-ai.vercel.app
```

### 2. 환경 변수 업데이트

배포 URL을 받은 후:

- [x] Vercel 환경 변수 `PUBLIC_SITE_URL` 업데이트
- [x] Supabase Redirect URLs에 실제 배포 URL 추가
- [x] 재배포 (환경 변수 변경 후)

### 3. 프로덕션 테스트

실제 배포된 사이트에서:

- [x] 회원가입 테스트 (실제 이메일 계정 사용)
- [x] 이메일 인증 테스트
- [x] 로그인/로그아웃 테스트
- [x] 브라우저 콘솔 에러 확인
- [x] 네트워크 탭에서 API 호출 확인

### 4. 모니터링

- [x] Vercel 대시보드에서 로그 확인
- [x] Supabase 대시보드에서 Auth 활동 확인
- [x] Database 사용량 모니터링

## ⚠️ 일반적인 문제 및 해결

### 문제: "Invalid Redirect URL" 에러

**원인**: Supabase에 리다이렉트 URL이 등록되지 않음

**해결**:
1. Supabase Dashboard > Authentication > URL Configuration
2. 배포 URL + `/auth/callback` 추가
3. 예: `https://my-speaking-ai.vercel.app/auth/callback`

### 문제: 이메일 인증 후 localhost로 리다이렉트됨

**원인**: `PUBLIC_SITE_URL` 환경 변수가 프로덕션 URL로 설정되지 않음

**해결**:
1. Vercel 환경 변수 확인
2. `PUBLIC_SITE_URL=https://your-actual-domain.com` 설정
3. 재배포

### 문제: 데이터베이스에 사용자 정보가 저장되지 않음

**원인**: SQL 마이그레이션이 실행되지 않았거나 트리거가 작동하지 않음

**해결**:
1. `sql/create_users_table.sql` 다시 실행
2. 트리거 확인:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. 필요시 트리거 수동 재생성

### 문제: 비밀번호 검증이 작동하지 않음

**원인**: 클라이언트와 서버 간 검증 로직 불일치

**해결**:
1. `src/lib/utils/passwordValidator.js` 파일 확인
2. AuthForm.svelte에서 import 확인
3. 브라우저 콘솔에서 JavaScript 에러 확인

## 📝 배포 로그

배포할 때마다 기록하세요:

| 날짜 | 버전 | 변경사항 | 담당자 | 비고 |
|------|------|---------|--------|------|
| 2026-01-30 | v1.0.0 | 초기 배포 | - | 비밀번호 검증, 이메일 인증 추가 |
|  |  |  |  |  |

## 🔄 롤백 절차

문제 발생 시:

```bash
# Vercel에서 이전 배포로 롤백
vercel rollback [deployment-url]

# 또는 Vercel 대시보드에서 Deployments > Promote to Production
```

## 📞 긴급 연락처

- Vercel 지원: https://vercel.com/support
- Supabase 지원: https://supabase.com/support
- OpenAI 지원: https://help.openai.com

---

**마지막 업데이트**: 2026-01-30
**작성자**: AI Assistant
