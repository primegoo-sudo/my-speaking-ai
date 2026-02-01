-- 사용자 역할(권한) 관리를 위한 마이그레이션
-- users 테이블에 role 컬럼 추가

-- 1. role enum 타입 생성 (이미 존재하는 경우 무시)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
  END IF;
END
$$;

-- 2. users 테이블에 role 컬럼 추가
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- 3. is_admin 필드 추가 (호환성용, role 기반 권한과 함께 사용)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 4. role 변경 시 is_admin도 자동 업데이트하는 트리거 함수
CREATE OR REPLACE FUNCTION public.sync_is_admin_from_role()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_admin = (NEW.role = 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. role 변경 시 자동 트리거
DROP TRIGGER IF EXISTS trg_sync_is_admin_from_role ON public.users;
CREATE TRIGGER trg_sync_is_admin_from_role
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_is_admin_from_role();

-- 6. 기존 데이터에 대한 마이그레이션 (is_admin이 true인 경우 role을 'admin'으로 변경)
UPDATE public.users
SET role = 'admin'
WHERE is_admin = true AND role = 'user';

-- 7. 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);

-- 8. 관리자만 사용자 목록을 조회할 수 있도록 RLS 정책 추가
-- (기존 정책은 유지, 새로운 정책 추가)
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 9. 관리자만 사용자 역할을 수정할 수 있도록 정책 추가
CREATE POLICY "Admins can update user roles"
  ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 10. 권한 부여
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- 테이블 설명 업데이트
COMMENT ON COLUMN public.users.role IS '사용자 역할: user(일반), admin(관리자), moderator(중재자)';
COMMENT ON COLUMN public.users.is_admin IS '관리자 여부 (role 기반 호환성용)';
