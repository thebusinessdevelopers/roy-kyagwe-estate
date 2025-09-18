create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

create table if not exists projects(
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

create table if not exists sessions(
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  agent text not null check (agent in ('partner','dev')),
  zone text,
  context jsonb,
  started_at timestamptz default now()
);

create table if not exists notes(
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  kind text not null check (kind in ('thought','dev-log')),
  content text not null,
  created_at timestamptz default now()
);

create table if not exists decisions(
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  title text not null,
  rationale text not null,
  status text not null check (status in ('proposed','accepted','rejected')),
  acceptance jsonb,
  created_at timestamptz default now()
);

create table if not exists artefacts(
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  ref text not null,
  meta jsonb,
  created_at timestamptz default now()
);

create table if not exists documents(
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  title text not null,
  content text not null,
  checksum text not null,
  tags text[] default '{}',
  agent text,
  deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists document_revisions(
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  checksum text not null,
  content text not null,
  commit_sha text,
  branch text,
  action text not null check (action in ('create','update','delete','noop')),
  created_at timestamptz default now()
);

create index if not exists idx_documents_path on documents(path);
create index if not exists idx_documents_checksum on documents(checksum);
create index if not exists idx_document_revisions_doc on document_revisions(document_id);

alter table documents enable row level security;
alter table document_revisions enable row level security;
alter table projects enable row level security;
alter table sessions enable row level security;
alter table notes enable row level security;
alter table decisions enable row level security;
alter table artefacts enable row level security;

create policy "anon can read documents" on documents for select using (true);
create policy "anon can read document_revisions" on document_revisions for select using (true);

create policy "anon no read sessions" on sessions for select using (false);
create policy "anon no read notes" on notes for select using (false);
create policy "anon no read decisions" on decisions for select using (false);
create policy "anon no read artefacts" on artefacts for select using (false);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_documents_updated_at on documents;
create trigger trg_documents_updated_at
before update on documents
for each row execute procedure set_updated_at();
