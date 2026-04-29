-- Fix: create_default_columns must be SECURITY DEFINER so it can insert
-- into public.columns even before the creator is added as a project member.
-- Without this, RLS blocks the column insert and project creation fails entirely.

create or replace function public.create_default_columns()
returns trigger language plpgsql security definer as $$
begin
  insert into public.columns (project_id, title, position, color)
  values
    (new.id, 'To Do',       0, '#94a3b8'),
    (new.id, 'In Progress', 1, '#3b82f6'),
    (new.id, 'Done',        2, '#22c55e');
  return new;
end;
$$;

-- Also add email column to profiles if not already added (from migration 0002)
alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
and p.email is null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
