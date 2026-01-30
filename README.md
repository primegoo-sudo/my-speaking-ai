# My Speaking AI

음성 기반 AI 영어 회화 학습 애플리케이션입니다. SvelteKit과 Supabase를 사용하여 구축되었습니다.

## 주요 기능

- 🎤 실시간 음성 녹음 및 텍스트 변환
- 💬 AI 기반 영어 회화 연습
- 🔐 안전한 사용자 인증 (이메일 인증 포함)
- 📊 대화 기록 관리
- 🎨 반응형 UI (Tailwind CSS)

## 환경 설정

### 1. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 값을 입력하세요:

```bash
cp .env.example .env
```

필수 환경 변수:

```env
# Supabase 설정
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
PUBLIC_SUPABASE_DB_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_DB_PUBLIC_KEY=your-public-key

# 사이트 URL (이메일 인증 리다이렉트용)
# 로컬 개발: http://localhost:5173
# 프로덕션: https://your-domain.com
PUBLIC_SITE_URL=http://localhost:5173

# OpenAI API (선택사항)
OPENAI_API_KEY=sk-your-key
```

### 2. 데이터베이스 마이그레이션

Supabase 프로젝트의 SQL Editor에서 다음 SQL 파일을 순서대로 실행하세요:

1. **사용자 테이블 생성**: `sql/create_users_table.sql`
   - 사용자 프로필 정보를 저장하는 테이블 생성
   - Row Level Security (RLS) 정책 설정
   - Auth 트리거 자동 설정 (회원가입 시 자동으로 사용자 프로필 생성)

2. **테스트 테이블** (선택): `sql/create_test_table.sql`

### 3. Supabase 인증 설정

Supabase 대시보드에서 이메일 인증을 활성화하세요:

1. **Authentication > Settings**로 이동
2. **Email Auth** 활성화
3. **Email Templates** 에서 Confirm signup 템플릿 확인
4. **Redirect URLs**에 다음 URL 추가:
   - `http://localhost:5173/auth/callback` (로컬)
   - `https://your-domain.com/auth/callback` (프로덕션)

## 개발 시작

### 패키지 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

서버가 시작되면 http://localhost:5173 에서 앱을 확인할 수 있습니다.

### 테스트 실행

```bash
npm test
```

## 배포

### Vercel 배포

```bash
npm run build
vercel --prod
```

배포 전 확인사항:
- [ ] `.env` 파일의 `PUBLIC_SITE_URL`을 프로덕션 URL로 변경
- [ ] Vercel 환경 변수에 모든 필수 변수 설정
- [ ] Supabase Redirect URLs에 프로덕션 URL 추가

## 프로젝트 구조

```
src/
├── lib/
│   ├── components/      # Svelte 컴포넌트
│   ├── composables/     # 재사용 가능한 로직
│   ├── utils/           # 유틸리티 함수
│   ├── stores/          # 상태 관리
│   └── server/          # 서버 측 유틸리티
├── routes/              # SvelteKit 라우트
│   ├── api/             # API 엔드포인트
│   ├── auth/            # 인증 관련 페이지
│   └── practice/        # AI 대화 연습 페이지
└── sql/                 # 데이터베이스 스키마
```

## 비밀번호 요구사항

회원가입 시 비밀번호는 다음 조건을 만족해야 합니다:
- ✓ 최소 6자 이상
- ✓ 영문 대문자 (A-Z) 포함
- ✓ 영문 소문자 (a-z) 포함
- ✓ 특수문자 (!@#$%^&* 등) 포함

## 문제 해결

### 이메일 인증이 작동하지 않는 경우

1. Supabase 대시보드에서 Email Auth가 활성화되어 있는지 확인
2. Redirect URLs에 올바른 URL이 추가되어 있는지 확인
3. `.env` 파일의 `PUBLIC_SITE_URL`이 올바른지 확인

### 데이터베이스에 사용자 정보가 저장되지 않는 경우

1. `sql/create_users_table.sql`이 정상적으로 실행되었는지 확인
2. Supabase SQL Editor에서 다음 쿼리로 트리거 확인:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. 수동으로 사용자 확인:
   ```sql
   SELECT * FROM public.users;
   ```

## 라이선스

MIT

## 기여

이슈와 풀 리퀘스트를 환영합니다!
