# 회화 기록 저장 기능 설정 완료

## ✅ 생성된 파일

### 1. SQL 스크립트
📄 **[sql/create_conversations_table.sql](sql/create_conversations_table.sql)**
- Supabase에서 실행할 SQL 쿼리
- conversations 테이블 생성
- RLS 정책 및 권한 설정

### 2. 설정 가이드
📄 **[CONVERSATIONS_SETUP.md](CONVERSATIONS_SETUP.md)**
- 단계별 설정 방법
- SQL 실행 방법
- 테스트 쿼리

### 3. 스키마 문서
📄 **[CONVERSATIONS_SCHEMA.md](CONVERSATIONS_SCHEMA.md)**
- 데이터베이스 구조 다이어그램
- 데이터 흐름
- RLS 정책 설명
- 쿼리 예시

## 🚀 즉시 실행 가능한 SQL

아래 SQL을 Supabase SQL Editor에 복사하여 실행하세요:

```sql
-- 영어 회화 기록 저장 테이블
-- 사용자별로 대화 내용과 AI 응답을 저장합니다.

-- pgcrypto 확장 활성화
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- conversations 테이블 생성
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  user_message text NOT NULL,
  assistant_message text NOT NULL,
  duration integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_created_at_idx ON public.conversations(created_at DESC);

-- Row Level Security (RLS) 활성화
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 회화 기록만 조회 가능
CREATE POLICY "Users can view own conversations"
  ON public.conversations
  FOR SELECT
  USING (auth.uid() = user_id);

-- 정책: 사용자는 자신의 회화 기록을 생성 가능
CREATE POLICY "Users can insert own conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 정책: 사용자는 자신의 회화 기록을 삭제 가능
CREATE POLICY "Users can delete own conversations"
  ON public.conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- 권한 부여 (authenticated 사용자만)
GRANT SELECT, INSERT, DELETE ON public.conversations TO authenticated;
```

## 📊 테이블 구조

| 칼럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 기록 ID (자동 생성) |
| `user_id` | UUID | 사용자 ID (auth.users와 연동) |
| `title` | TEXT | 대화 제목 (선택사항) |
| `user_message` | TEXT | 사용자 음성 텍스트 |
| `assistant_message` | TEXT | AI 응답 메시지 |
| `duration` | INTEGER | 대화 시간 (초 단위) |
| `created_at` | TIMESTAMPTZ | 기록 생성 시간 |
| `created_at` | TIMESTAMPTZ | 생성 시간 (자동) |

## 🔐 보안 (RLS 정책)

- ✅ **SELECT**: 자신의 기록만 조회
- ✅ **INSERT**: 자신의 기록만 생성
- ✅ **DELETE**: 자신의 기록만 삭제
- ❌ UPDATE: 불가능 (기록 수정 방지)

## ⚡ 다음 단계

SQL을 실행한 후:

1. ✅ Supabase Table Editor에서 `conversations` 테이블 확인
2. ✅ 3개의 RLS 정책이 생성된 것 확인
3. 🔜 API 엔드포인트 구현 (별도 요청)
4. 🔜 대화 저장 기능 추가 (별도 요청)
5. 🔜 대화 조회 페이지 추가 (별도 요청)

## 💡 특징

### 간단한 구현
- ✅ 최소한의 칼럼으로 필요한 정보만 저장
- ✅ 복잡한 스키마 없음
- ✅ 향후 확장 가능한 구조

### 보안
- ✅ 자동 RLS 적용
- ✅ 사용자 데이터 분리
- ✅ 권한 기반 접근 제어

### 성능
- ✅ user_id 인덱스: 사용자별 조회 빠름
- ✅ created_at 인덱스: 시간순 정렬 빠름

---

**SQL 실행 후 완료입니다! 🎉**

다음 단계(API 구현, 기능 추가 등)가 필요하면 말씀해주세요.
