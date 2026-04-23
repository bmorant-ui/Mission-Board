-- Add email column to profiles
alter table public.profiles add column if not exists email text;

-- Backfill email from auth.users for existing profiles
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
and p.email is null;

-- Update handle_new_user to also store email
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
