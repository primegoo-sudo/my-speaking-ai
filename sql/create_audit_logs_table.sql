-- 감시 로그 테이블
-- 보안 관련 이벤트를 기록합니다.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 이벤트 정보
  event text NOT NULL, -- AUTH_LOGIN, API_CALL, PERMISSION_DENIED 등
  severity text NOT NULL DEFAULT 'INFO', -- INFO, WARNING, ERROR, CRITICAL
  
  -- 사용자 정보
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- 관리자 작업 시 대상 사용자
  
  -- 리소스 정보
  resource text NOT NULL, -- 'authentication', 'api_access', 'user_management' 등
  details jsonb DEFAULT '{}'::jsonb, -- 상세 정보 (JSON)
  
  -- 클라이언트 정보
  ip_address text DEFAULT NULL,
  user_agent text DEFAULT NULL,
  
  -- 타이밍
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 인덱스 생성 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx 
ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx 
ON public.audit_logs(user_id);

CREATE INDEX IF NOT EXISTS audit_logs_event_idx 
ON public.audit_logs(event);

CREATE INDEX IF NOT EXISTS audit_logs_severity_idx 
ON public.audit_logs(severity);

CREATE INDEX IF NOT EXISTS audit_logs_ip_address_idx 
ON public.audit_logs(ip_address);

-- 복합 인덱스 (사용자별 이벤트 조회)
CREATE INDEX IF NOT EXISTS audit_logs_user_event_idx 
ON public.audit_logs(user_id, created_at DESC);

-- Row Level Security (RLS) 활성화
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 정책: 인증된 사용자는 자신의 감시 로그만 조회 가능
CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- 정책: 관리자는 모든 감시 로그 조회 가능
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 정책: 서버만 감시 로그 생성 가능
CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- 권한 부여
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO service_role;

-- 코멘트 추가
COMMENT ON TABLE public.audit_logs IS '보안 감시 로그 - 모든 보안 관련 이벤트 기록';
COMMENT ON COLUMN public.audit_logs.event IS '이벤트 유형 (AUTH_LOGIN, API_CALL, PERMISSION_DENIED 등)';
COMMENT ON COLUMN public.audit_logs.severity IS '심각도 수준 (INFO, WARNING, ERROR, CRITICAL)';
COMMENT ON COLUMN public.audit_logs.user_id IS '작업을 수행한 사용자 ID';
COMMENT ON COLUMN public.audit_logs.target_user_id IS '작업의 대상 사용자 ID (관리자 작업)';
COMMENT ON COLUMN public.audit_logs.resource IS '영향받은 리소스 (authentication, api_access, user_management)';
COMMENT ON COLUMN public.audit_logs.details IS '상세 정보 (JSON 형식)';
COMMENT ON COLUMN public.audit_logs.ip_address IS '요청을 보낸 클라이언트 IP 주소';
COMMENT ON COLUMN public.audit_logs.user_agent IS '클라이언트 User-Agent 정보';

-- 자동 정리 정책 (90일 이상 된 로그 자동 삭제 - 선택사항)
-- 참고: Supabase에서는 직접 설정 불가, 대신 트리거나 정기 작업으로 처리 필요
-- SELECT cron.schedule('delete-old-audit-logs', '0 2 * * *', $$
--   DELETE FROM public.audit_logs
--   WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days'
-- $$);
