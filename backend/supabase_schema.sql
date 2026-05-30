-- NinjaPing — Supabase schema (optional durable mirror + Realtime feed)
-- Run in the Supabase SQL editor. The backend mirrors every pulse here; the
-- frontend can subscribe with supabase-js Realtime instead of (or alongside)
-- the FastAPI SSE stream.

create table if not exists pulses (
    id           uuid primary key,
    created_at   timestamptz not null default now(),
    type         text not null check (type in ('BUY','HYPE','DUMP','VOLUME')),
    token        text not null,
    ai_report    text not null,
    metrics      jsonb not null default '{}'::jsonb,
    degen_score  int  not null default 50 check (degen_score between 0 and 100),
    persona      text not null default 'standard',
    keywords     jsonb not null default '[]'::jsonb,
    raw          jsonb not null default '{}'::jsonb
);

create index if not exists pulses_created_at_idx on pulses (created_at desc);
create index if not exists pulses_token_idx on pulses (token);

-- Enable Realtime so the dashboard receives inserts instantly.
alter publication supabase_realtime add table pulses;

-- Read-only public access for the anon dashboard (writes use the service key).
alter table pulses enable row level security;
create policy "public read pulses" on pulses for select using (true);
