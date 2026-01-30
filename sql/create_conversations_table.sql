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
