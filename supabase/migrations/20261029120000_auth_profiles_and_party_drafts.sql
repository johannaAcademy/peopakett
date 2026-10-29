create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (
    full_name is null
    or char_length(btrim(full_name)) between 2 and 80
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.party_plans (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'draft' check (status = 'draft'),
  event_type text not null check (event_type in ('birthday', 'anniversary', 'baby-shower', 'graduation', 'other')),
  audience text not null check (audience in ('children', 'adults', 'mixed')),
  age_group text not null check (char_length(btrim(age_group)) between 1 and 40),
  theme text not null check (theme in ('adventure', 'pirate', 'western', 'nineties', 'dinner', 'custom')),
  guest_count integer not null check (guest_count between 1 and 200),
  event_date date not null check (event_date >= (now() at time zone 'Europe/Tallinn')::date),
  event_time time not null,
  location text not null check (char_length(btrim(location)) between 2 and 120),
  venue_type text not null check (venue_type in ('indoor', 'outdoor', 'either')),
  budget_cents integer not null check (budget_cents between 5000 and 5000000),
  currency text not null default 'EUR' check (currency = 'EUR'),
  details jsonb not null default '{"costs":[],"priorities":[]}'::jsonb check (
    jsonb_typeof(details) = 'object'
    and pg_column_size(details) <= 65536
    and jsonb_typeof(details -> 'costs') is not distinct from 'array'
    and jsonb_array_length(details -> 'costs') <= 100
    and jsonb_typeof(details -> 'priorities') is not distinct from 'array'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create index parties_owner_updated_idx on public.parties (owner_id, updated_at desc);
create index party_plans_owner_updated_idx on public.party_plans (owner_id, updated_at desc);
create index party_plans_party_id_idx on public.party_plans (party_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger parties_set_updated_at
before update on public.parties
for each row execute function public.set_updated_at();

create trigger party_plans_set_updated_at
before update on public.party_plans
for each row execute function public.set_updated_at();

revoke all on function public.set_updated_at() from public, anon, authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 80), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.parties enable row level security;
alter table public.party_plans enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

create policy "Profiles are readable by their owner"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Profiles are editable by their owner"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

grant select, insert, update, delete on public.parties to authenticated;

create policy "Owners can read their parties"
on public.parties for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "Owners can create their parties"
on public.parties for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Owners can update their parties"
on public.parties for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "Owners can delete their parties"
on public.parties for delete to authenticated
using ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.party_plans to authenticated;

create policy "Owners can read their party plans"
on public.party_plans for select to authenticated
using (
  (select auth.uid()) = owner_id
  and exists (
    select 1
    from public.parties
    where parties.id = party_plans.party_id
      and parties.owner_id = (select auth.uid())
  )
);

create policy "Owners can create plans for their parties"
on public.party_plans for insert to authenticated
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1
    from public.parties
    where parties.id = party_plans.party_id
      and parties.owner_id = (select auth.uid())
  )
);

create policy "Owners can update their party plans"
on public.party_plans for update to authenticated
using (
  (select auth.uid()) = owner_id
  and exists (
    select 1
    from public.parties
    where parties.id = party_plans.party_id
      and parties.owner_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1
    from public.parties
    where parties.id = party_plans.party_id
      and parties.owner_id = (select auth.uid())
  )
);

create policy "Owners can delete their party plans"
on public.party_plans for delete to authenticated
using (
  (select auth.uid()) = owner_id
  and exists (
    select 1
    from public.parties
    where parties.id = party_plans.party_id
      and parties.owner_id = (select auth.uid())
  )
);

create function public.save_party_draft(p_plan_id uuid, p_draft jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_party_id uuid;
  v_plan_id uuid;
begin
  if v_owner_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(p_draft) is distinct from 'object' then
    raise exception 'Draft must be a JSON object' using errcode = '22023';
  end if;
  if pg_column_size(p_draft) > 65536 then
    raise exception 'Draft is too large' using errcode = '22023';
  end if;
  if jsonb_typeof(p_draft -> 'costs') is distinct from 'array'
    or jsonb_typeof(p_draft -> 'priorities') is distinct from 'array' then
    raise exception 'Draft details are invalid' using errcode = '22023';
  end if;
  if jsonb_array_length(p_draft -> 'costs') > 100 then
    raise exception 'Draft details are invalid' using errcode = '22023';
  end if;

  if p_plan_id is null then
    insert into public.parties (owner_id, title)
    values (v_owner_id, p_draft ->> 'title')
    returning id into v_party_id;

    insert into public.party_plans (
      party_id,
      owner_id,
      event_type,
      audience,
      age_group,
      theme,
      guest_count,
      event_date,
      event_time,
      location,
      venue_type,
      budget_cents,
      details
    )
    values (
      v_party_id,
      v_owner_id,
      p_draft ->> 'partyType',
      p_draft ->> 'audience',
      p_draft ->> 'ageGroup',
      p_draft ->> 'theme',
      (p_draft ->> 'guestCount')::integer,
      (p_draft ->> 'eventDate')::date,
      (p_draft ->> 'eventTime')::time,
      p_draft ->> 'location',
      p_draft ->> 'venueType',
      (p_draft ->> 'budgetCents')::integer,
      jsonb_build_object(
        'customTheme', p_draft -> 'customTheme',
        'venueNeed', p_draft -> 'venueNeed',
        'priorities', p_draft -> 'priorities',
        'costs', p_draft -> 'costs'
      )
    )
    returning id into v_plan_id;
  else
    select party_id
    into v_party_id
    from public.party_plans
    where id = p_plan_id
      and owner_id = v_owner_id
    for update;

    if v_party_id is null then
      raise exception 'Party plan not found' using errcode = '42501';
    end if;

    update public.parties
    set title = p_draft ->> 'title'
    where id = v_party_id
      and owner_id = v_owner_id;

    update public.party_plans
    set event_type = p_draft ->> 'partyType',
        audience = p_draft ->> 'audience',
        age_group = p_draft ->> 'ageGroup',
        theme = p_draft ->> 'theme',
        guest_count = (p_draft ->> 'guestCount')::integer,
        event_date = (p_draft ->> 'eventDate')::date,
        event_time = (p_draft ->> 'eventTime')::time,
        location = p_draft ->> 'location',
        venue_type = p_draft ->> 'venueType',
        budget_cents = (p_draft ->> 'budgetCents')::integer,
        details = jsonb_build_object(
          'customTheme', p_draft -> 'customTheme',
          'venueNeed', p_draft -> 'venueNeed',
          'priorities', p_draft -> 'priorities',
          'costs', p_draft -> 'costs'
        )
    where id = p_plan_id
      and owner_id = v_owner_id;

    v_plan_id := p_plan_id;
  end if;

  return v_plan_id;
end;
$$;

revoke all on function public.save_party_draft(uuid, jsonb) from public, anon;
grant execute on function public.save_party_draft(uuid, jsonb) to authenticated;
