-- Allow role changes from SQL Editor / service role (no auth.uid()),
-- while still blocking authenticated non-admins from self-promoting.

create or replace function public.profiles_guard_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Modification du rôle non autorisée';
  end if;
  return new;
end;
$$;
