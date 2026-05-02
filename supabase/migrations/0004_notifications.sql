-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
create table if not exists public.notifications (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  type          text not null, -- 'task_assigned' | 'project_added'
  title         text not null,
  body          text not null,
  resource_id   uuid,          -- task_id or project_id
  resource_type text,          -- 'task' | 'project'
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_read_idx on public.notifications(user_id, read);

-- RLS
alter table public.notifications enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='Users can view own notifications') then
    create policy "Users can view own notifications" on public.notifications
      for select using (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='Users can update own notifications') then
    create policy "Users can update own notifications" on public.notifications
      for update using (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='System can insert notifications') then
    create policy "System can insert notifications" on public.notifications
      for insert with check (true);
  end if;
end $$;

-- ============================================================
-- TRIGGER: notify when task is assigned
-- ============================================================
create or replace function public.notify_task_assigned()
returns trigger language plpgsql security definer as $$
declare
  v_assignee_id uuid;
  v_created_by  uuid;
  v_task_title  text;
  v_creator_name text;
begin
  -- Only fire when assignee_id is set or changed, and it's not the creator assigning to themselves
  v_assignee_id := new.assignee_id;
  v_created_by  := new.created_by;
  v_task_title  := new.title;

  if v_assignee_id is null then
    return new;
  end if;

  -- Don't notify if assigning to yourself
  if v_assignee_id = auth.uid() then
    return new;
  end if;

  -- On INSERT: notify new assignee
  if TG_OP = 'INSERT' then
    select full_name into v_creator_name from public.profiles where id = v_created_by;
    insert into public.notifications (user_id, type, title, body, resource_id, resource_type)
    values (
      v_assignee_id,
      'task_assigned',
      'You were assigned a task',
      coalesce(v_creator_name, 'Someone') || ' assigned you "' || v_task_title || '"',
      new.id,
      'task'
    );
  end if;

  -- On UPDATE: only notify if assignee changed
  if TG_OP = 'UPDATE' and (old.assignee_id is distinct from new.assignee_id) then
    select full_name into v_creator_name from public.profiles where id = auth.uid();
    insert into public.notifications (user_id, type, title, body, resource_id, resource_type)
    values (
      v_assignee_id,
      'task_assigned',
      'You were assigned a task',
      coalesce(v_creator_name, 'Someone') || ' assigned you "' || v_task_title || '"',
      new.id,
      'task'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_task_assigned on public.tasks;
create trigger on_task_assigned
  after insert or update of assignee_id on public.tasks
  for each row execute function public.notify_task_assigned();

-- ============================================================
-- TRIGGER: notify when added to a project
-- ============================================================
create or replace function public.notify_project_added()
returns trigger language plpgsql security definer as $$
declare
  v_project_name text;
begin
  -- Don't notify the creator adding themselves
  if new.user_id = auth.uid() then
    return new;
  end if;

  select name into v_project_name from public.projects where id = new.project_id;

  insert into public.notifications (user_id, type, title, body, resource_id, resource_type)
  values (
    new.user_id,
    'project_added',
    'You were added to a project',
    'You have been added to "' || coalesce(v_project_name, 'a project') || '"',
    new.project_id,
    'project'
  );

  return new;
end;
$$;

drop trigger if exists on_project_member_added on public.project_members;
create trigger on_project_member_added
  after insert on public.project_members
  for each row execute function public.notify_project_added();
