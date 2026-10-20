-- =====================================================================
-- MEGA STORY - migration (chạy trong Supabase > SQL Editor)
-- An toàn khi chạy lại nhiều lần. Không xóa dữ liệu cũ.
-- =====================================================================

-- 1. Bảng tác giả được phép soạn bài --------------------------------
create table if not exists public.authors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.authors enable row level security;

create or replace function public.is_author()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.authors where user_id = auth.uid());
$$;

-- 2. Bảng stories (nhiều truyện) --------------------------------------
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default 'Truyện chưa đặt tên',
  subtitle text,
  intro_media_url text,
  intro_media_type text check (intro_media_type in ('image', 'video')),
  outro_text text,
  outro_thanks text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists stories_touch on public.stories;
create trigger stories_touch before update on public.stories
  for each row execute function public.touch_updated_at();

-- 3. Chuyển dữ liệu từ story_settings (nếu còn) -----------------------
do $$
begin
  if to_regclass('public.story_settings') is not null
     and not exists (select 1 from public.stories) then
    insert into public.stories (slug, title, subtitle, intro_media_url, intro_media_type, outro_text, status)
    select 'truyen-dau-tien',
           coalesce(nullif(intro_title, ''), 'Truyện đầu tiên'),
           intro_subtitle,
           intro_media_url,
           case when intro_media_url ~* '\.(mp4|webm|mov|m4v)' then 'video'
                when intro_media_url is not null and intro_media_url <> '' then 'image' end,
           outro_text,
           'draft'
    from public.story_settings
    order by id
    limit 1;
  end if;
end $$;

-- 4. Bảng blocks -------------------------------------------------------
alter table public.blocks alter column id set default gen_random_uuid();
alter table public.blocks add column if not exists story_id uuid references public.stories(id) on delete cascade;
alter table public.blocks add column if not exists updated_at timestamptz not null default now();

-- Nếu có block cũ mà chưa có truyện nào, tạo một truyện để gắn vào
insert into public.stories (slug, title)
select 'truyen-dau-tien', 'Truyện đầu tiên'
where not exists (select 1 from public.stories)
  and exists (select 1 from public.blocks where story_id is null);

update public.blocks
set story_id = (select id from public.stories order by created_at limit 1)
where story_id is null;

alter table public.blocks alter column story_id set not null;

alter table public.blocks drop constraint if exists blocks_type_check;
alter table public.blocks add constraint blocks_type_check
  check (type in ('paragraph', 'image', 'gallery', 'quote', 'video')) not valid;

create index if not exists blocks_story_position_idx on public.blocks (story_id, position);

drop trigger if exists blocks_touch on public.blocks;
create trigger blocks_touch before update on public.blocks
  for each row execute function public.touch_updated_at();

-- 5. Hàm đổi thứ tự nhiều block cùng lúc -----------------------------
create or replace function public.reorder_blocks(p_story uuid, p_ids uuid[])
returns void
language plpgsql
security invoker
as $$
begin
  if not public.is_author() then
    raise exception 'not allowed';
  end if;
  update public.blocks b
  set position = t.ord - 1
  from unnest(p_ids) with ordinality as t(id, ord)
  where b.id = t.id and b.story_id = p_story;
end $$;

-- 6. Row Level Security -----------------------------------------------
alter table public.stories enable row level security;
alter table public.blocks enable row level security;

-- Xóa policy cũ của 3 bảng để tránh chồng chéo
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('stories', 'blocks', 'authors')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

create policy "authors: tự đọc dòng của mình" on public.authors
  for select to authenticated using (user_id = auth.uid());

create policy "stories: đọc bản đã xuất bản, tác giả đọc tất cả" on public.stories
  for select using (status = 'published' or public.is_author());
create policy "stories: tác giả thêm" on public.stories
  for insert to authenticated with check (public.is_author());
create policy "stories: tác giả sửa" on public.stories
  for update to authenticated using (public.is_author()) with check (public.is_author());
create policy "stories: tác giả xóa" on public.stories
  for delete to authenticated using (public.is_author());

create policy "blocks: đọc khi truyện đã xuất bản, tác giả đọc tất cả" on public.blocks
  for select using (
    public.is_author()
    or exists (select 1 from public.stories s where s.id = blocks.story_id and s.status = 'published')
  );
create policy "blocks: tác giả thêm" on public.blocks
  for insert to authenticated with check (public.is_author());
create policy "blocks: tác giả sửa" on public.blocks
  for update to authenticated using (public.is_author()) with check (public.is_author());
create policy "blocks: tác giả xóa" on public.blocks
  for delete to authenticated using (public.is_author());

-- 7. Storage: bucket story-media --------------------------------------
drop policy if exists "story-media: ai cũng xem" on storage.objects;
drop policy if exists "story-media: tác giả tải lên" on storage.objects;
drop policy if exists "story-media: tác giả sửa" on storage.objects;
drop policy if exists "story-media: tác giả xóa" on storage.objects;

create policy "story-media: ai cũng xem" on storage.objects
  for select using (bucket_id = 'story-media');
create policy "story-media: tác giả tải lên" on storage.objects
  for insert to authenticated with check (bucket_id = 'story-media' and public.is_author());
create policy "story-media: tác giả sửa" on storage.objects
  for update to authenticated using (bucket_id = 'story-media' and public.is_author());
create policy "story-media: tác giả xóa" on storage.objects
  for delete to authenticated using (bucket_id = 'story-media' and public.is_author());

-- 8. SAU KHI bạn đăng ký tài khoản, chạy riêng câu này (thay email) ----
-- insert into public.authors (user_id)
-- select id from auth.users where email = 'EMAIL_CUA_BAN@gmail.com';
