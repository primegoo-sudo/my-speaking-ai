-- 사용자 프로필에 이름과 전화번호 컬럼 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- phone에 유니크 제약 추가 (선택사항)
-- CREATE UNIQUE INDEX IF NOT EXISTS users_phone_idx ON public.users(phone) WHERE phone IS NOT NULL;

-- 주석 추가
COMMENT ON COLUMN public.users.phone IS '사용자 전화번호';
COMMENT ON COLUMN public.users.profile_completed IS '프로필 완성 여부 (이름, 전화번호, 약관동의 완료)';
