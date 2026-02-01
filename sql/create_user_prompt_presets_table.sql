-- 사용자별 AI 튜터 프롬프트 프리셋 테이블
-- 사용자가 자주 사용하는 AI 설정을 저장하고 관리

CREATE TABLE IF NOT EXISTS public.user_prompt_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preset_name text NOT NULL,
  is_default boolean DEFAULT false,
  prompt_settings jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- 사용자당 프리셋 이름은 고유해야 함
  CONSTRAINT unique_user_preset_name UNIQUE (user_id, preset_name)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS user_prompt_presets_user_id_idx 
ON public.user_prompt_presets(user_id);

CREATE INDEX IF NOT EXISTS user_prompt_presets_is_default_idx 
ON public.user_prompt_presets(user_id, is_default) 
WHERE is_default = true;

-- prompt_settings에 GIN 인덱스 추가
CREATE INDEX IF NOT EXISTS user_prompt_presets_settings_idx 
ON public.user_prompt_presets USING GIN (prompt_settings);

-- Row Level Security (RLS) 활성화
ALTER TABLE public.user_prompt_presets ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 프리셋만 조회 가능
CREATE POLICY "Users can view own presets"
  ON public.user_prompt_presets
  FOR SELECT
  USING (auth.uid() = user_id);

-- 정책: 사용자는 자신의 프리셋을 생성 가능
CREATE POLICY "Users can insert own presets"
  ON public.user_prompt_presets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 정책: 사용자는 자신의 프리셋을 수정 가능
CREATE POLICY "Users can update own presets"
  ON public.user_prompt_presets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 정책: 사용자는 자신의 프리셋을 삭제 가능
CREATE POLICY "Users can delete own presets"
  ON public.user_prompt_presets
  FOR DELETE
  USING (auth.uid() = user_id);

-- 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_prompt_presets TO authenticated;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_prompt_presets_updated_at
  BEFORE UPDATE ON public.user_prompt_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 기본 프리셋은 사용자당 하나만 가능하도록 트리거
CREATE OR REPLACE FUNCTION ensure_single_default_preset()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- 다른 기본 프리셋의 is_default를 false로 변경
    UPDATE public.user_prompt_presets
    SET is_default = false
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_preset_trigger
  BEFORE INSERT OR UPDATE ON public.user_prompt_presets
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_preset();

-- 주석 추가
COMMENT ON TABLE public.user_prompt_presets IS '사용자별 AI 튜터 프롬프트 프리셋 저장';
COMMENT ON COLUMN public.user_prompt_presets.preset_name IS '프리셋 이름 (예: 나의 초급 설정, 비즈니스 영어)';
COMMENT ON COLUMN public.user_prompt_presets.is_default IS '기본 프리셋 여부 (사용자당 1개만 가능)';
COMMENT ON COLUMN public.user_prompt_presets.prompt_settings IS 'AI 설정 (role, personality, responseLength, topics, correctionStyle, difficulty)';
