-- Document Vault foundation (non-PHI only)
-- Creates:
-- 1. public.documents table
-- 2. RLS policies for owner-only reads/inserts
-- 3. private Storage bucket: documents
-- 4. Storage policies for owner-only reads/inserts by user-id path

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  category text not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists documents_user_id_idx
  on public.documents (user_id);

create index if not exists documents_uploaded_at_idx
  on public.documents (uploaded_at desc);

alter table public.documents enable row level security;

drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own"
on public.documents
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own"
on public.documents
for insert
to authenticated
with check (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "storage_documents_select_own" on storage.objects;
create policy "storage_documents_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "storage_documents_insert_own" on storage.objects;
create policy "storage_documents_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
