# 회원가입 & 이메일 인증 테스트 가이드

## 체크리스트

### 설정 확인 (필수)

- [ ] `.env` 파일이 다음 값을 포함하고 있는가:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  - `PUBLIC_SUPABASE_DB_URL`
  - `PUBLIC_SUPABASE_DB_SERVICE_ROLE` (관리자 키)
  - `PUBLIC_SITE_URL=http://localhost:5173`

- [ ] Supabase 데이터베이스에서 `public.users` 테이블 생성됨
  - SQL Editor에서 `sql/create_users_table.sql` 실행
  
- [ ] Supabase Authentication 설정:
  - Email provider 활성화됨
  - "Confirm email" 활성화됨
  - SMTP/Email 제공자 설정 완료

### 로컬 테스트

1. **개발 서버 시작**
   ```bash
   npm run dev
   ```

2. **회원가입 페이지 접속**
   - http://localhost:5173/signup

3. **테스트 계정 생성**
   - Name: `Test User`
   - Email: `test@example.com` (테스트 이메일)
   - Password: `TestPassword123!`

4. **이메일 인증 확인**
   - Supabase 대시보드 > Authentication > Logs 에서 이메일 전송 로그 확인
   - 실제 SMTP 설정된 경우: 해당 이메일 계정에서 확인 메일 수신

5. **데이터베이스 확인**
   ```sql
   -- Supabase SQL Editor에서 실행
   SELECT * FROM public.users WHERE email = 'test@example.com';
   ```
   - 사용자 레코드가 저장되어 있는지 확인

### 트러블슈팅

#### 1. "Missing PUBLIC_SUPABASE_DB_SERVICE_ROLE" 에러

**원인**: 환경 변수 누락

**해결책**:
```bash
# .env 파일 확인
cat .env

# 필요한 값:
# PUBLIC_SUPABASE_DB_SERVICE_ROLE=YOUR_SERVICE_ROLE_KEY
```

Supabase 대시보드에서 Service Role Key 가져오기:
1. Supabase 대시보드 접속
2. Settings > API
3. Service role key 복사 (숨겨진 값 클릭)
4. `.env` 파일에 `PUBLIC_SUPABASE_DB_SERVICE_ROLE=` 뒤에 붙여넣기

#### 2. 회원가입 시 "Error creating user" 메시지

**확인 사항**:
1. 이미 같은 이메일로 가입한 계정이 있는지 확인
2. 비밀번호가 6자 이상인지 확인
3. 이메일 형식이 올바른지 확인
4. Supabase Auth Provider가 활성화되어 있는지 확인

#### 3. 이메일 미인증 상태로 로그인 불가

**의도한 동작입니다** - 이메일 확인 후에만 로그인 가능

**임시 테스트용 이메일 확인 강제 해제** (프로덕션에서는 금지):
```sql
-- Supabase SQL Editor에서 실행 (관리자만)
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'test@example.com';
```

#### 4. "Trigger on_auth_user_created not found" 또는 사용자가 DB에 저장 안 됨

**확인**:
1. `sql/create_users_table.sql` 이 완전히 실행되었는지 확인
2. Supabase SQL Editor에서 트리거 확인:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

**트리거 재생성**:
```sql
-- auth.users 테이블에 대한 트리거 다시 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, metadata)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 프로덕션 배포 전 확인

- [ ] `PUBLIC_SITE_URL` 이 올바른 도메인으로 설정됨
  - 예: `https://myapp.com` (Vercel의 경우: `https://myapp.vercel.app`)

- [ ] Supabase SMTP 설정이 프로덕션 이메일 제공자로 설정됨
  - SendGrid, AWS SES, 또는 다른 SMTP 제공자

- [ ] 이메일 템플릿이 올바르게 설정됨
  - 발신자 이메일 확인
  - 리다이렉트 URL 올바른지 확인

- [ ] CORS 설정 확인 (필요한 경우)
  - Supabase > Settings > API > CORS settings

## 성공 시나리오

1. ✅ 회원가입 페이지에서 계정 생성
2. ✅ "인증 이메일이 전송되었습니다" 메시지 표시
3. ✅ 이메일 수신 (또는 Supabase Logs에서 확인)
4. ✅ 이메일 인증 링크 클릭
5. ✅ 이메일 확인 완료 메시지 표시
6. ✅ 로그인 페이지로 리다이렉트
7. ✅ 생성한 계정으로 로그인 성공
8. ✅ Practice 페이지 접속 가능

## 추가 도움

문제가 해결되지 않으면:
1. Supabase 대시보드 > Authentication > Logs 에서 에러 로그 확인
2. 브라우저 개발자 도구 > Console 에서 자세한 에러 메시지 확인
3. 터미널에서 서버 로그 확인
