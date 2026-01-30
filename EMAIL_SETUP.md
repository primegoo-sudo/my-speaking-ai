# 이메일 인증 설정 가이드

## 개요
회원가입 시 이메일 인증 및 사용자 데이터베이스 저장을 위한 설정 가이드입니다.

## 필수 단계

### 1단계: Supabase 데이터베이스 테이블 생성

Supabase 프로젝트의 SQL Editor에서 다음 파일의 SQL을 실행하세요:
- `sql/create_users_table.sql` - 사용자 프로필 테이블 생성

이 SQL은 다음을 포함합니다:
- `public.users` 테이블 생성
- auth.users 에 새 사용자 생성 시 자동으로 public.users에 저장하는 트리거
- Row Level Security (RLS) 정책

### 2단계: Supabase 이메일 인증 활성화

1. **Supabase 대시보드 접속**
   - Authentication > Providers > Email 이동
   
2. **이메일 설정**
   - "Enable Email provider" 활성화
   - "Confirm email" 활성화 (기본값)

3. **이메일 제공자 선택** (선택사항)
   - **무료 옵션**: Supabase에서 제공하는 기본 이메일 (소량 전송 가능)
   - **SMTP**: Custom SMTP 설정으로 Gmail, SendGrid 등 사용

#### Gmail SMTP 설정 방법 (추천: 무료)

1. Google Cloud Console 접속
2. 프로젝트 생성 및 Gmail API 활성화
3. OAuth 2.0 클라이언트 ID (Desktop) 생성
4. Supabase SMTP 설정:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: `your-email@gmail.com`
   - Password: Google App Password (2-Step Verification 필요)

#### SendGrid 설정 (추천: 안정적)

1. SendGrid 가입 (무료: 월 100개 이메일)
2. API Key 생성
3. Supabase SMTP 설정:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: `SG.xxxxx` (SendGrid API Key)

### 3단계: 환경 변수 확인

`.env` 파일에 다음이 설정되어 있는지 확인:

```env
PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
PUBLIC_SUPABASE_DB_URL=https://[your-project-id].supabase.co
PUBLIC_SUPABASE_DB_PUBLIC_KEY=[your-anon-key]
PUBLIC_SITE_URL=http://localhost:5173  # 또는 배포된 도메인
```

### 4단계: 이메일 템플릿 커스터마이징 (선택사항)

Supabase 대시보드에서 이메일 템플릿을 커스터마이징할 수 있습니다:
- Authentication > Email Templates
- Confirmation Link, Magic Link 등의 템플릿 수정

## 작동 방식

1. 사용자가 회원가입 페이지에서 이름, 이메일, 비밀번호 입력
2. 서버(`/signup` API)에서:
   - `supabaseAdmin.auth.admin.createUser()` 로 Supabase Auth 사용자 생성
   - `supabaseAdmin.auth.admin.inviteUserByEmail()` 로 이메일 인증 링크 발송
   - SQL 트리거가 자동으로 `public.users` 테이블에 사용자 저장
3. 사용자가 이메일의 인증 링크 클릭
4. `/auth/callback` 페이지에서 이메일 인증 완료 처리
5. 이메일 인증 완료 후 로그인 가능

## 문제 해결

### 이메일이 오지 않는 경우

1. **스팸 폴더 확인**
   - 이메일이 스팸으로 분류될 수 있음
   
2. **SMTP 설정 확인**
   - Supabase 대시보드 > Authentication > Email Provider 확인
   - SMTP 자격증명이 올바른지 확인

3. **발신자 이메일 확인**
   - Authentication > Email Templates 에서 발신자 이메일 확인

4. **로그 확인**
   - Supabase 대시보드 > Authentication > Logs 에서 이메일 전송 로그 확인

### 사용자가 DB에 저장되지 않는 경우

1. **트리거 확인**
   ```sql
   -- Supabase SQL Editor에서 실행
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. **사용자 테이블 확인**
   ```sql
   SELECT * FROM public.users;
   ```

3. **RLS 정책 확인**
   - public.users 테이블이 anon 역할에 대해 SELECT/INSERT 권한 있는지 확인

### 로컬 개발 시 이메일 미리보기

Supabase 대시보드의 Authentication > Logs 에서 이메일 전송 히스토리 확인 가능합니다.

## 프로덕션 배포 시

### Vercel 배포

1. Vercel 프로젝트 설정에서 환경 변수 추가:
   ```
   PUBLIC_SUPABASE_URL
   PUBLIC_SUPABASE_ANON_KEY
   PUBLIC_SUPABASE_DB_URL
   PUBLIC_SUPABASE_DB_PUBLIC_KEY
   PUBLIC_SITE_URL=https://your-domain.vercel.app
   ```

2. Supabase 이메일 템플릿의 `{{ confirmation_url }}` 이 올바르게 설정되어 있는지 확인
   - 리다이렉트 URL: `https://your-domain.vercel.app/auth/callback`

## 추가 참고

- [Supabase Auth 공식 문서](https://supabase.com/docs/guides/auth)
- [Supabase SMTP 설정](https://supabase.com/docs/guides/auth/auth-smtp)
- [SendGrid 공식 문서](https://sendgrid.com/docs/)
