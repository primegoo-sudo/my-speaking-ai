# 빠른 시작 가이드

My Speaking AI 프로젝트를 로컬에서 실행하는 방법입니다.

## 전제조건

- Node.js 18 이상
- npm 또는 pnpm
- Supabase 계정 (무료)

## 1단계: 프로젝트 설정

```bash
# 저장소 클론 (또는 다운로드)
git clone [repository-url]
cd my-speaking-ai

# 패키지 설치
npm install
```

## 2단계: Supabase 프로젝트 생성

1. https://supabase.com 에서 무료 계정 생성
2. 새 프로젝트 생성
3. 프로젝트 대시보드에서 다음 정보 확인:
   - Project URL
   - Project API keys > anon/public
   - **Settings > API > Service role key** (회원가입/이메일용)

## 3단계: 환경 변수 설정

```bash
# .env.example을 .env로 복사
cp .env.example .env
```

`.env` 파일을 열고 다음 값 입력:

```env
PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
PUBLIC_SUPABASE_DB_URL=https://[your-project-id].supabase.co
PUBLIC_SUPABASE_DB_PUBLIC_KEY=[your-anon-key]
PUBLIC_SUPABASE_DB_SERVICE_ROLE=[your-service-role-key]  # ⚠️ 중요!
PUBLIC_SITE_URL=http://localhost:5173
```

**⚠️ SERVICE_ROLE 키 가져오기**:
- Supabase 대시보드 > Settings > API > Service role key 복사
```

환경 변수가 올바르게 설정되었는지 확인:

```bash
npm run check:env
```

## 4단계: 데이터베이스 설정

### 사용자 테이블 생성

1. Supabase 대시보드 > SQL Editor 열기
2. `sql/create_users_table.sql` 파일 내용 복사하여 SQL Editor에 붙여넣기
3. **Run** 클릭

이 SQL에 포함되는 것:
- `public.users` 테이블 (사용자 프로필)
- 자동 저장 트리거 (auth.users → public.users)
- Row Level Security (RLS) 정책

### 이메일 인증 설정

**Supabase 대시보드**에서:

1. **Authentication > Providers > Email** 이동
2. **Enable Email Provider** ✓ 활성화
3. **Confirm email** ✓ 활성화
4. (선택) SMTP 설정으로 실제 이메일 발송 (EMAIL_SETUP.md 참조)

## 5단계: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 열기

## 6단계: 테스트

### 회원가입 테스트

1. 회원가입 페이지 (`/signup`) 접속
2. 계정 정보 입력:
   - Name: 최소 3자
   - Email: 유효한 이메일
   - Password: 6자 이상, 대문자+소문자+특수문자 포함
3. "회원가입" 클릭
4. "인증 이메일이 전송되었습니다" 메시지 확인
5. 이메일에서 인증 링크 클릭 (또는 아래 DB 확인)

### 데이터베이스 확인

Supabase 대시보드 > SQL Editor에서:

```sql
-- 회원가입한 사용자 확인
SELECT id, email, name, created_at 
FROM public.users 
ORDER BY created_at DESC;
```

## 일반적인 문제

### "Missing PUBLIC_SUPABASE_DB_SERVICE_ROLE" 에러

**해결**:
1. `.env` 파일 확인
2. `PUBLIC_SUPABASE_DB_SERVICE_ROLE` 키 입력 (Settings > API > Service role key)
3. 개발 서버 재시작

### 회원가입 후 데이터베이스에 저장 안 됨

**해결**:
1. SQL 트리거 확인:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. 트리거 없으면 `sql/create_users_table.sql` 다시 실행

### 이메일 인증 이메일이 오지 않음

**로컬 개발**: 
- Supabase 대시보드 > Authentication > Logs 에서 이메일 발송 확인

**이메일 실제 수신**:
- EMAIL_SETUP.md 참조 (Gmail SMTP, SendGrid 등 설정)

## 📚 추가 가이드

- **[SIGNUP_FIXES.md](SIGNUP_FIXES.md)** - 회원가입/이메일 인증 변경 사항
- **[EMAIL_SETUP.md](EMAIL_SETUP.md)** - 이메일 발송 설정 (Gmail, SendGrid 등)
- **[SIGNUP_TEST_GUIDE.md](SIGNUP_TEST_GUIDE.md)** - 회원가입 테스트 및 트러블슈팅
- [README.md](README.md) - 전체 프로젝트 문서
- [DEPLOYMENT.md](DEPLOYMENT.md) - 프로덕션 배포 가이드
- [sql/](sql/) - 데이터베이스 스키마

## 도움이 필요하신가요?

Issues 탭에서 질문하거나 기존 이슈를 검색하세요.
