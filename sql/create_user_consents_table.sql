-- 사용자 약관 동의 기록 테이블
-- 개인정보 처리방침 및 서비스 이용약관 동의 기록

CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 동의 항목
  privacy_policy boolean NOT NULL DEFAULT false,
  terms_of_service boolean NOT NULL DEFAULT false,
  
  -- 동의 버전 (향후 약관 변경 시 추적 가능)
  privacy_policy_version text DEFAULT 'v1.0',
  terms_of_service_version text DEFAULT 'v1.0',
  
  -- 동의 일시
  consented_at timestamptz NOT NULL DEFAULT now(),
  
  -- IP 주소 등 추가 정보 (선택)
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS user_consents_user_id_idx 
ON public.user_consents(user_id);

CREATE INDEX IF NOT EXISTS user_consents_consented_at_idx 
ON public.user_consents(consented_at DESC);

-- Row Level Security (RLS) 활성화
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 동의 기록만 조회 가능
CREATE POLICY "Users can view own consents"
  ON public.user_consents
  FOR SELECT
  USING (auth.uid() = user_id);

-- 정책: 사용자는 자신의 동의 기록을 생성 가능
CREATE POLICY "Users can insert own consents"
  ON public.user_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 정책: 사용자는 자신의 동의 기록을 수정 가능
CREATE POLICY "Users can update own consents"
  ON public.user_consents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 권한 부여
GRANT SELECT, INSERT, UPDATE ON public.user_consents TO authenticated;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON public.user_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 주석 추가
COMMENT ON TABLE public.user_consents IS '사용자 약관 동의 기록 (개인정보 처리방침, 서비스 이용약관)';
COMMENT ON COLUMN public.user_consents.privacy_policy IS '개인정보 처리방침 동의 여부';
COMMENT ON COLUMN public.user_consents.terms_of_service IS '서비스 이용약관 동의 여부';
COMMENT ON COLUMN public.user_consents.privacy_policy_version IS '동의한 개인정보 처리방침 버전';
COMMENT ON COLUMN public.user_consents.terms_of_service_version IS '동의한 서비스 이용약관 버전';
COMMENT ON COLUMN public.user_consents.consented_at IS '동의 일시';
