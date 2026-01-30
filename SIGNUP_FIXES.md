# 회원가입 & 이메일 인증 수정 사항

## 📋 변경 사항 요약

이 업데이트는 회원가입 시 사용자가 데이터베이스에 저장되지 않고 인증 이메일이 발송되지 않던 문제를 해결합니다.

## 🔧 수정된 파일

### 1. **`src/routes/signup/+server.js`** (핵심)
**변경 전**: 클라이언트 Supabase 객체 사용, 데이터베이스 저장 없음
**변경 후**: 
- 서버 관리자 권한(`supabaseAdmin`) 사용
- `createUser()` 로 Supabase Auth 사용자 생성
- `inviteUserByEmail()` 로 이메일 인증 링크 자동 발송
- 사용자 정보를 `public.users` 테이블에 저장

### 2. **`src/lib/composables/useAuth.js`** (중요)
**변경 전**: 클라이언트에서 직접 Supabase Auth 호출
**변경 후**: 
- 서버 `/signup` API 엔드포인트 호출
- 서버에서 모든 인증 로직 처리
- 클라이언트는 응답만 처리

### 3. **`src/lib/server/supabaseAdmin.js`** (강화)
**변경 전**: 환경 변수 누락 시 조용히 실패
**변경 후**: 
- 누락된 환경 변수 명확히 표시
- 서비스 역할 키 관련 상세 도움말 제공

### 4. **신규 가이드 문서**
- `EMAIL_SETUP.md` - 이메일 설정 상세 가이드
- `SIGNUP_TEST_GUIDE.md` - 회원가입 테스트 및 트러블슈팅

## 🎯 작동 흐름

### 회원가입 (이전)
```
클라이언트 → supabaseClient.auth.signUp() 
         → (데이터베이스 저장 시도, 실패가능)
         → (이메일 발송 안 됨)
```

### 회원가입 (현재)
```
클라이언트 → /signup API 호출 (서버)
        → supabaseAdmin.auth.admin.createUser() (Supabase Auth)
        → public.users 테이블에 저장 (또는 트리거가 자동 저장)
        → supabaseAdmin.auth.admin.inviteUserByEmail() (이메일 발송)
        → 응답 반환
```

## 📝 필수 설정

### 1. 환경 변수 확인 (`.env`)

```env
# Supabase
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
PUBLIC_SUPABASE_DB_URL=https://YOUR_PROJECT.supabase.co
PUBLIC_SUPABASE_DB_SERVICE_ROLE=YOUR_SERVICE_ROLE_KEY  # ⚠️ 중요!
PUBLIC_SITE_URL=http://localhost:5173  # 프로덕션에서는 도메인으로 변경
```

**SERVICE_ROLE 키 가져오기**:
1. Supabase 대시보드 접속
2. Settings > API > Service role key
3. 키 복사하여 `.env`에 붙여넣기

### 2. Supabase 데이터베이스 설정

```bash
# 터미널에서 실행
npm run check:env  # 환경 변수 확인

# Supabase SQL Editor에서 실행
# sql/create_users_table.sql 의 내용을 모두 복사해서 실행
```

**포함되는 것**:
- `public.users` 테이블 생성
- 자동으로 사용자를 `public.users`에 저장하는 트리거
- Row Level Security (RLS) 정책

### 3. Supabase Authentication 설정

**필수**:
1. Dashboard > Authentication > Providers > Email
2. "Enable Email Provider" ✓ 활성화
3. "Confirm email" ✓ 활성화

**선택사항 (이메일 실제 발송)**:
- SMTP 설정 (Gmail, SendGrid 등)
- 미설정 시: Supabase 대시보드 Logs에서만 확인 가능

## 🧪 테스트

자세한 테스트 방법은 `SIGNUP_TEST_GUIDE.md` 참조

**빠른 테스트**:
1. `npm run dev` 실행
2. http://localhost:5173/signup 접속
3. 계정 생성
4. 성공 메시지 확인
5. Supabase 대시보드에서 DB에 저장된 사용자 확인

## ⚠️ 주의사항

### 프로덕션 배포 전

1. **PUBLIC_SITE_URL 수정**
   ```env
   PUBLIC_SITE_URL=https://your-domain.com  # Vercel의 경우: https://your-app.vercel.app
   ```

2. **이메일 제공자 설정**
   - Supabase 기본 이메일 (제한적)
   - SendGrid, AWS SES 등 (권장)

3. **CORS 확인**
   - Supabase Dashboard > Settings > API > CORS

## 🚀 배포 (Vercel)

1. Vercel 프로젝트 설정에 환경 변수 추가:
   ```
   PUBLIC_SUPABASE_URL
   PUBLIC_SUPABASE_ANON_KEY
   PUBLIC_SUPABASE_DB_URL
   PUBLIC_SUPABASE_DB_SERVICE_ROLE
   PUBLIC_SITE_URL=https://your-vercel-app.vercel.app
   ```

2. 배포

## 📚 추가 문서

- **EMAIL_SETUP.md** - 이메일 설정 상세 가이드 (Gmail SMTP, SendGrid 등)
- **SIGNUP_TEST_GUIDE.md** - 테스트 및 트러블슈팅
- **GETTING_STARTED.md** - 기본 설정 (기존)

## 🔍 문제 해결

### 이메일이 안 옴
→ EMAIL_SETUP.md 참조

### 사용자가 DB에 저장 안 됨
→ SIGNUP_TEST_GUIDE.md의 "trigger not found" 섹션 참조

### "SERVICE_ROLE" 에러
→ 환경 변수에서 `PUBLIC_SUPABASE_DB_SERVICE_ROLE` 설정 확인

## 💡 핵심 개선 사항

| 항목 | 이전 | 현재 |
|------|------|------|
| 회원가입 방식 | 클라이언트 직접 | 서버 API |
| DB 저장 | 불안정 (클라이언트) | 안정적 (서버) |
| 이메일 발송 | 미구현 | 자동 발송 |
| 권한 관리 | Anon 키 | Service Role 키 |
| 보안 | ⚠️ 노출 위험 | ✅ 안전 |
