# 마이그레이션 노트 v1.0.0

## 개요

회원가입 후 데이터베이스 저장 문제와 환경 설정 문제를 해결했습니다.

날짜: 2026-01-30

## 주요 변경사항

### 1. 환경 변수 관리 개선

#### 문제
- 이메일 인증 리다이렉트 URL이 localhost로 하드코딩되어 프로덕션 환경에서 작동 안 함
- 환경 변수 누락 시 명확한 에러 메시지 없음

#### 해결
- ✅ `src/lib/utils/env.js` 추가 - 환경 변수 중앙 관리
- ✅ `PUBLIC_SITE_URL` 환경 변수 추가
- ✅ `getEmailRedirectUrl()` 함수로 동적 URL 생성
- ✅ `supabaseClient.js`에 환경 변수 검증 로직 추가

**영향받는 파일:**
- `src/lib/utils/env.js` (신규)
- `src/lib/composables/useAuth.js` (수정)
- `src/lib/supabaseClient.js` (수정)
- `.env.example` (수정)

### 2. 데이터베이스 사용자 정보 저장

#### 문제
- 회원가입 후 `public.users` 테이블에 사용자 정보가 저장되지 않음
- auth.users에만 저장되고 애플리케이션 데이터와 연동 안 됨

#### 해결
- ✅ `sql/create_users_table.sql` 생성 - 완전한 스키마 정의
- ✅ RLS (Row Level Security) 정책 설정
- ✅ auth.users 트리거로 자동 사용자 프로필 생성
- ✅ `useAuth.js`에 백업 저장 로직 추가 (upsert)

**새로운 파일:**
- `sql/create_users_table.sql` (필수 마이그레이션)

**데이터베이스 구조:**
```sql
public.users (
  id uuid PRIMARY KEY,           -- auth.users.id 참조
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamptz,
  updated_at timestamptz,
  metadata jsonb
)
```

### 3. 유지보수 도구 추가

#### 새로운 스크립트
- ✅ `scripts/check-env.js` - 환경 변수 검증
- ✅ `scripts/migrate-db.js` - DB 마이그레이션 가이드

#### 새로운 npm 명령어
```bash
npm run check:env    # 환경 변수 검증
npm run db:migrate   # DB 마이그레이션 가이드 출력
```

### 4. 문서화 개선

#### 새로운 문서
- ✅ `DEPLOYMENT.md` - 프로덕션 배포 체크리스트
- ✅ `GETTING_STARTED.md` - 빠른 시작 가이드
- ✅ `README.md` - 전체 리뉴얼

#### 문서 구조
```
README.md           → 프로젝트 개요, 기능, 설치
GETTING_STARTED.md  → 초보자용 단계별 가이드
DEPLOYMENT.md       → 프로덕션 배포 체크리스트
```

## 마이그레이션 가이드

### 기존 프로젝트를 업데이트하는 경우

#### 1. 환경 변수 추가

`.env` 파일에 다음 추가:

```env
PUBLIC_SITE_URL=http://localhost:5173  # 로컬
# PUBLIC_SITE_URL=https://your-domain.com  # 프로덕션
```

#### 2. 환경 변수 검증

```bash
npm run check:env
```

#### 3. 데이터베이스 마이그레이션

```bash
# 가이드 확인
npm run db:migrate

# Supabase SQL Editor에서 실행
# sql/create_users_table.sql
```

#### 4. Supabase 설정 업데이트

**Redirect URLs 추가:**
- `http://localhost:5173/auth/callback`
- `https://your-domain.com/auth/callback`

#### 5. 코드 변경사항 없음

기존 코드는 그대로 작동합니다. 새로운 기능:
- 이메일 인증 리다이렉트가 자동으로 환경에 맞게 동작
- 사용자 정보가 데이터베이스에 자동 저장
- 환경 변수 누락 시 명확한 에러 메시지

## 테스트 체크리스트

배포 전 다음 항목들을 테스트하세요:

- [ ] 환경 변수 검증: `npm run check:env`
- [ ] 로컬 회원가입 테스트
- [ ] 이메일 인증 링크 클릭 테스트
- [ ] 데이터베이스에 사용자 저장 확인
- [ ] 프로덕션 빌드: `npm run build && npm run preview`

## 롤백 방법

문제 발생 시:

### 코드 롤백
```bash
git revert [commit-hash]
```

### 데이터베이스 롤백
```sql
-- 트리거 제거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 함수 제거
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 테이블 제거 (주의: 데이터 손실)
DROP TABLE IF EXISTS public.users;
```

## 호환성

- ✅ 기존 회원 데이터 유지 (auth.users)
- ✅ 이전 버전 코드와 호환 (선택적 업그레이드)
- ✅ 점진적 마이그레이션 가능

## 참고사항

1. **환경 변수는 민감 정보**
   - `.env` 파일은 절대 커밋하지 마세요
   - Vercel/배포 플랫폼에서 별도 설정 필요

2. **데이터베이스 트리거**
   - 트리거는 한 번만 설정하면 됨
   - 회원가입 시 자동으로 public.users 생성

3. **백업 저장 로직**
   - 트리거 실패 시 useAuth.js의 upsert가 백업
   - 이중 안전장치로 데이터 손실 방지

## 다음 단계

- [ ] API Rate Limiting 추가
- [ ] 사용자 프로필 편집 기능
- [ ] 비밀번호 재설정 기능
- [ ] 소셜 로그인 (Google, GitHub)

---

**작성자**: AI Assistant  
**날짜**: 2026-01-30  
**버전**: 1.0.0
