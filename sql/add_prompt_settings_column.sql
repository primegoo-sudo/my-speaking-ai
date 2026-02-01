-- AI 프롬프트 설정을 저장하기 위한 컬럼 추가
-- 대화 시 사용된 AI 설정(성격/톤, 역할, 난이도 등)을 기록

ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS prompt_settings jsonb;

-- prompt_settings 컬럼에 GIN 인덱스 추가 (JSON 검색 성능 향상)
CREATE INDEX IF NOT EXISTS conversations_prompt_settings_idx 
ON public.conversations USING GIN (prompt_settings);

-- 기존 레코드에 기본값 설정 (선택사항)
UPDATE public.conversations 
SET prompt_settings = '{
  "role": "친절하고 도움이 되는 다국어 대화 도우미",
  "personality": "따뜻하고, 격려하며, 친근함",
  "responseLength": "2-3 문장",
  "topics": "일상 대화, 취미, 여행, 직장, 음식, 건강, 목표",
  "correctionStyle": "대화 중 자연스럽게 부드럽게 교정",
  "difficulty": "사용자 수준에 맞춰 점진적으로 난이도 조절"
}'::jsonb
WHERE prompt_settings IS NULL;

-- 주석 추가
COMMENT ON COLUMN public.conversations.prompt_settings IS 'AI 프롬프트 설정 (역할, 성격, 응답길이, 주제, 교정스타일, 난이도)';
