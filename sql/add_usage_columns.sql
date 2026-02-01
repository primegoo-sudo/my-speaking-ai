-- OpenAI 사용량/요금 추적 컬럼 추가
alter table public.conversations
  add column if not exists audio_input_seconds integer default 0,
  add column if not exists audio_output_seconds integer default 0,
  add column if not exists transcription_chars integer default 0,
  add column if not exists tts_chars integer default 0,
  add column if not exists prompt_tokens integer default 0,
  add column if not exists completion_tokens integer default 0,
  add column if not exists total_tokens integer default 0,
  add column if not exists estimated_cost_usd numeric(12,6) default 0;

create index if not exists conversations_created_at_desc_idx on public.conversations (created_at desc);
