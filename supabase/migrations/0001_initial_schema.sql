-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS (safe: skip if already exists)
-- ============================================================
do $$ begin create type task_priority as enum ('low', 'medium', 'high', 'urgent'); exception when duplicate_object then null; end $$;
do $$ begin create type grant_status as enum ('research', 'drafting', 'submitted', 'awarded', 'rejected', 'closed'); exception when duplicate_object then null; end $$;
do $$ begin create type member_role as enum ('admin', 'manager', 'member', 'viewer'); exception when duplicate_object then null; end $$;
do $$ begin create type volunteer_status as enum ('active', 'inactive', 'pending'); exception when duplicate_object then null; end $$;

-- ============================================================
-- PROFILES (extends auth.users 1:1)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  avatar_url  text,
  role        member_role not null default 'member',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PROJECTS
-- ============================================================
create table if not exists public.projects (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  color       text not null default '#6366f1',
  start_date  date,
  end_date    date,
  archived    boolean not null default false,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PROJECT MEMBERS
-- ============================================================
create table if not exists public.project_members (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        member_role not null default 'member',
  joined_at   timestamptz not null default now(),
  unique(project_id, user_id)
);

-- ============================================================
-- COLUMNS (Kanban columns per project)
-- ============================================================
create table if not exists public.columns (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  position    integer not null default 0,
  color       text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- TASKS
-- ============================================================
create table if not exists public.tasks (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  column_id    uuid not null references public.columns(id) on delete cascade,
  title        text not null,
  description  text,
  priority     task_priority not null default 'medium',
  due_date     date,
  position     integer not null default 0,
  assignee_id  uuid references public.profiles(id) on delete set null,
  created_by   uuid references public.profiles(id) on delete set null,
  tags         text[] not null default '{}',
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- TASK COMMENTS
-- ============================================================
create table if not exists public.task_comments (
  id         uuid primary key default uuid_generate_v4(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- GRANTS
-- ============================================================
create table if not exists public.grants (
  id               uuid primary key default uuid_generate_v4(),
  project_id       uuid references public.projects(id) on delete set null,
  title            text not null,
  funder_name      text not null,
  funder_contact   text,
  amount_requested numeric(12,2),
  amount_awarded   numeric(12,2),
  status           grant_status not null default 'research',
  deadline         date,
  submission_date  date,
  report_due       date,
  notes            text,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- VOLUNTEERS
-- ============================================================
create table if not exists public.volunteers (
  id             uuid primary key default uuid_generate_v4(),
  full_name      text not null,
  email          text unique,
  phone          text,
  status         volunteer_status not null default 'pending',
  skills         text[] not null default '{}',
  availability   jsonb,
  notes          text,
  linked_user_id uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- VOLUNTEER ASSIGNMENTS
-- ============================================================
create table if not exists public.volunteer_assignments (
  id             uuid primary key default uuid_generate_v4(),
  volunteer_id   uuid not null references public.volunteers(id) on delete cascade,
  project_id     uuid not null references public.projects(id) on delete cascade,
  role_title     text,
  start_date     date,
  end_date       date,
  hours_per_week integer,
  created_at     timestamptz not null default now(),
  unique(volunteer_id, project_id)
);

-- ============================================================
-- BUDGET LINE ITEMS
-- ============================================================
create table if not exists public.budget_items (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  grant_id    uuid references public.grants(id) on delete set null,
  category    text not null,
  description text not null,
  budgeted    numeric(12,2) not null default 0,
  actual      numeric(12,2) not null default 0,
  notes       text,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES (safe: skip if already exists)
-- ============================================================
create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists tasks_column_id_idx on public.tasks(column_id);
create index if not exists tasks_assignee_id_idx on public.tasks(assignee_id);
create index if not exists tasks_due_date_idx on public.tasks(due_date);
create index if not exists project_members_user_id_idx on public.project_members(user_id);
create index if not exists project_members_project_id_idx on public.project_members(project_id);
create index if not exists grants_project_id_idx on public.grants(project_id);
create index if not exists grants_deadline_idx on public.grants(deadline);
create index if not exists budget_items_project_id_idx on public.budget_items(project_id);
create index if not exists volunteer_assignments_project_id_idx on public.volunteer_assignments(project_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.projects;
create trigger set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.tasks;
create trigger set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.task_comments;
create trigger set_updated_at before update on public.task_comments
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.grants;
create trigger set_updated_at before update on public.grants
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.volunteers;
create trigger set_updated_at before update on public.volunteers
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.budget_items;
create trigger set_updated_at before update on public.budget_items
  for each row execute function public.set_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.columns enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.grants enable row level security;
alter table public.volunteers enable row level security;
alter table public.volunteer_assignments enable row level security;
alter table public.budget_items enable row level security;

create or replace function public.is_project_member(p_project_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id
    and user_id = auth.uid()
  );
$$;

create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- PROFILES
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can view all profiles') then
    create policy "Users can view all profiles" on public.profiles
      for select using (auth.uid() is not null);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can update own profile') then
    create policy "Users can update own profile" on public.profiles
      for update using (id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can insert own profile') then
    create policy "Users can insert own profile" on public.profiles
      for insert with check (id = auth.uid());
  end if;
end $$;

-- PROJECTS
do $$ begin
  if not exists (select 1 from pg_policies where tablename='projects' and policyname='Members can view their projects') then
    create policy "Members can view their projects" on public.projects
      for select using (public.is_project_member(id) or public.is_admin());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='projects' and policyname='Authenticated users can create projects') then
    create policy "Authenticated users can create projects" on public.projects
      for insert with check (auth.uid() is not null);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='projects' and policyname='Admins or creators can update projects') then
    create policy "Admins or creators can update projects" on public.projects
      for update using (public.is_admin() or created_by = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='projects' and policyname='Admins can delete projects') then
    create policy "Admins can delete projects" on public.projects
      for delete using (public.is_admin() or created_by = auth.uid());
  end if;
end $$;

-- PROJECT_MEMBERS
do $$ begin
  if not exists (select 1 from pg_policies where tablename='project_members' and policyname='Members can view project memberships') then
    create policy "Members can view project memberships" on public.project_members
      for select using (public.is_project_member(project_id) or public.is_admin());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='project_members' and policyname='Project creators can manage members') then
    create policy "Project creators can manage members" on public.project_members
      for all using (public.is_admin() or exists (
        select 1 from public.projects p
        where p.id = project_id and p.created_by = auth.uid()
      ));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='project_members' and policyname='Users can join projects') then
    create policy "Users can join projects" on public.project_members
      for insert with check (user_id = auth.uid());
  end if;
end $$;

-- COLUMNS
do $$ begin
  if not exists (select 1 from pg_policies where tablename='columns' and policyname='Project members can view columns') then
    create policy "Project members can view columns" on public.columns
      for select using (public.is_project_member(project_id) or public.is_admin());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='columns' and policyname='Project members can manage columns') then
    create policy "Project members can manage columns" on public.columns
      for all using (public.is_project_member(project_id) or public.is_admin());
  end if;
end $$;

-- TASKS
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tasks' and policyname='Project members can view tasks') then
    create policy "Project members can view tasks" on public.tasks
      for select using (public.is_project_member(project_id) or public.is_admin());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tasks' and policyname='Project members can create tasks') then
    create policy "Project members can create tasks" on public.tasks
      for insert with check (public.is_project_member(project_id) or public.is_admin());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tasks' and policyname='Project members can update tasks') then
    create policy "Project members can update tasks" on public.tasks
      for update using (public.is_project_member(project_id) or public.is_admin());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tasks' and policyname='Task creator or admin can delete') then
    create policy "Task creator or admin can delete" on public.tasks
      for delete using (created_by = auth.uid() or public.is_admin());
  end if;
end $$;

-- TASK_COMMENTS
do $$ begin
  if not exists (select 1 from pg_policies where tablename='task_comments' and policyname='Project members can view comments') then
    create policy "Project members can view comments" on public.task_comments
      for select using (exists (
        select 1 from public.tasks t
        where t.id = task_id and (public.is_project_member(t.project_id) or public.is_admin())
      ));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='task_comments' and policyname='Members can create comments') then
    create policy "Members can create comments" on public.task_comments
      for insert with check (author_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='task_comments' and policyname='Authors can update own comments') then
    create policy "Authors can update own comments" on public.task_comments
      for update using (author_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='task_comments' and policyname='Authors or admins can delete comments') then
    create policy "Authors or admins can delete comments" on public.task_comments
      for delete using (author_id = auth.uid() or public.is_admin());
  end if;
end $$;

-- GRANTS
do $$ begin
  if not exists (select 1 from pg_policies where tablename='grants' and policyname='Authenticated users can view grants') then
    create policy "Authenticated users can view grants" on public.grants
      for select using (auth.uid() is not null);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='grants' and policyname='Authenticated users can manage grants') then
    create policy "Authenticated users can manage grants" on public.grants
      for all using (auth.uid() is not null);
  end if;
end $$;

-- VOLUNTEERS
do $$ begin
  if not exists (select 1 from pg_policies where tablename='volunteers' and policyname='Authenticated users can view volunteers') then
    create policy "Authenticated users can view volunteers" on public.volunteers
      for select using (auth.uid() is not null);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='volunteers' and policyname='Authenticated users can manage volunteers') then
    create policy "Authenticated users can manage volunteers" on public.volunteers
      for all using (auth.uid() is not null);
  end if;
end $$;

-- VOLUNTEER_ASSIGNMENTS
do $$ begin
  if not exists (select 1 from pg_policies where tablename='volunteer_assignments' and policyname='Authenticated users can view assignments') then
    create policy "Authenticated users can view assignments" on public.volunteer_assignments
      for select using (auth.uid() is not null);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='volunteer_assignments' and policyname='Authenticated users can manage assignments') then
    create policy "Authenticated users can manage assignments" on public.volunteer_assignments
      for all using (auth.uid() is not null);
  end if;
end $$;

-- BUDGET_ITEMS
do $$ begin
  if not exists (select 1 from pg_policies where tablename='budget_items' and policyname='Project members can view budget') then
    create policy "Project members can view budget" on public.budget_items
      for select using (public.is_project_member(project_id) or public.is_admin());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='budget_items' and policyname='Project members can manage budget') then
    create policy "Project members can manage budget" on public.budget_items
      for all using (public.is_project_member(project_id) or public.is_admin());
  end if;
end $$;

-- ============================================================
-- AUTO-CREATE DEFAULT COLUMNS ON PROJECT CREATE
-- ============================================================
create or replace function public.create_default_columns()
returns trigger language plpgsql as $$
begin
  insert into public.columns (project_id, title, position, color)
  values
    (new.id, 'To Do',       0, '#94a3b8'),
    (new.id, 'In Progress', 1, '#3b82f6'),
    (new.id, 'Done',        2, '#22c55e');
  return new;
end;
$$;

drop trigger if exists on_project_created on public.projects;
create trigger on_project_created
  after insert on public.projects
  for each row execute function public.create_default_columns();

-- ============================================================
-- AUTO-ADD CREATOR AS PROJECT MEMBER (admin role)
-- ============================================================
create or replace function public.add_creator_as_member()
returns trigger language plpgsql security definer as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.created_by, 'admin')
  on conflict (project_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_project_created_add_member on public.projects;
create trigger on_project_created_add_member
  after insert on public.projects
  for each row execute function public.add_creator_as_member();
