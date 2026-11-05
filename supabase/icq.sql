-- ICQ 2001b: Besucher und Nachrichten für den Chat zwischen Webseiten-Besuchern.
-- Einmal im Supabase SQL-Editor ausführen. Voraussetzung: "Allow anonymous sign-ins" ist aktiv.

create table if not exists public.icq_visitors (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  uin text unique not null check (uin ~ '^[0-9]{6,9}$'),
  nick text not null check (char_length(nick) between 1 and 20),
  last_seen timestamptz not null default now()
);

create table if not exists public.icq_messages (
  id bigint generated always as identity primary key,
  sender uuid not null default auth.uid() references public.icq_visitors (id) on delete cascade,
  recipient uuid not null references public.icq_visitors (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 240),
  created_at timestamptz not null default now(),
  check (sender <> recipient)
);

create index if not exists icq_visitors_last_seen on public.icq_visitors (last_seen desc);
create index if not exists icq_messages_recipient on public.icq_messages (recipient, created_at);
create index if not exists icq_messages_sender on public.icq_messages (sender, created_at);

alter table public.icq_visitors enable row level security;
alter table public.icq_messages enable row level security;

drop policy if exists "visitors readable" on public.icq_visitors;
create policy "visitors readable" on public.icq_visitors
  for select to authenticated using (true);

drop policy if exists "own visitor insert" on public.icq_visitors;
create policy "own visitor insert" on public.icq_visitors
  for insert to authenticated with check (id = (select auth.uid()));

drop policy if exists "own visitor update" on public.icq_visitors;
create policy "own visitor update" on public.icq_visitors
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "send as self" on public.icq_messages;
create policy "send as self" on public.icq_messages
  for insert to authenticated with check (sender = (select auth.uid()));

drop policy if exists "read own conversations" on public.icq_messages;
create policy "read own conversations" on public.icq_messages
  for select to authenticated using ((select auth.uid()) in (sender, recipient));

-- Höchstens 20 Nachrichten pro Minute und Absender.
create or replace function public.icq_message_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.icq_messages
      where sender = new.sender and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'icq rate limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists icq_message_rate_limit on public.icq_messages;
create trigger icq_message_rate_limit
  before insert on public.icq_messages
  for each row execute function public.icq_message_rate_limit();

-- Neue Nachrichten in Echtzeit an den Empfänger (RLS gilt auch hier).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'icq_messages'
  ) then
    alter publication supabase_realtime add table public.icq_messages;
  end if;
end;
$$;

-- Täglich aufräumen: alles älter als 7 Tage, dazu die anonymen Konten ohne Besuch.
create extension if not exists pg_cron;

create or replace function public.icq_cleanup()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.icq_messages where created_at < now() - interval '7 days';
  delete from auth.users u
    where u.is_anonymous
      and u.created_at < now() - interval '7 days'
      and not exists (
        select 1 from public.icq_visitors v
        where v.id = u.id and v.last_seen >= now() - interval '7 days'
      );
$$;

revoke all on function public.icq_cleanup() from public, anon, authenticated;

select cron.unschedule('icq-cleanup') where exists (select 1 from cron.job where jobname = 'icq-cleanup');
select cron.schedule('icq-cleanup', '17 3 * * *', 'select public.icq_cleanup()');
