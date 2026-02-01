-- 정책(개인정보 처리방침/이용약관) 관리 테이블
create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('privacy_policy', 'terms_of_service')),
  version text not null,
  content text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists policies_type_version_unique on public.policies (type, version);
create index if not exists policies_type_active_idx on public.policies (type, is_active);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_policies_updated_at on public.policies;
create trigger set_policies_updated_at
before update on public.policies
for each row
execute function public.set_updated_at();

-- RLS 활성화 및 읽기 정책 (약관은 공개적으로 읽기 허용)
alter table public.policies enable row level security;

drop policy if exists "Allow public read policies" on public.policies;
create policy "Allow public read policies"
  on public.policies
  for select
  using (is_active = true);

-- 기본 데이터(필요 시 수정)
insert into public.policies (type, version, content, is_active)
values
  ('privacy_policy', 'v1.0',
   '수집하는 개인정보 항목\n- 필수: 이메일, 이름, 전화번호\n- 자동 수집: 서비스 이용 기록, 접속 로그\n\n개인정보의 수집 및 이용 목적\n- 서비스 제공 및 계약 이행\n- 회원 관리 및 본인 확인\n- 서비스 개선 및 맞춤형 서비스 제공\n\n보유 및 이용 기간\n- 회원 탈퇴 시까지 (단, 관계 법령에 따라 일정 기간 보관)',
   true),
  ('terms_of_service', 'v1.0',
   '서비스 이용 규칙\n- 본 서비스는 AI 영어 회화 학습을 위한 플랫폼입니다\n- 회원은 관계 법령 및 이 약관을 준수해야 합니다\n- 타인의 정보 도용 및 부정 사용을 금지합니다\n\n서비스 제공\n- AI 음성 대화 기능 제공\n- 대화 기록 저장 및 관리\n- 개인 맞춤형 학습 설정\n\n회원의 의무\n- 정확한 정보 제공\n- 계정 정보 보안 유지\n- 서비스의 부적절한 사용 금지',
   true)
on conflict (type, version) do nothing;
