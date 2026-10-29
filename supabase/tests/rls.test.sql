begin;

select plan(6);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'planner-owner@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Plaanide omanik"}',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'planner-other@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );

set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';

insert into public.parties (id, owner_id, title)
values (
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000001',
  'Omaniku sünnipäev'
);

insert into public.party_plans (
  id,
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
  budget_cents
)
values (
  '00000000-0000-4000-8000-000000000021',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000001',
  'birthday',
  'children',
  '6–12 aastat',
  'pirate',
  12,
  current_date + 7,
  '12:00',
  'Tartu',
  'indoor',
  100000
);

select is(
  (select count(*) from public.party_plans where id = '00000000-0000-4000-8000-000000000021'),
  1::bigint,
  'an owner can read their party plan'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';

select is(
  (select count(*) from public.profiles where id = '00000000-0000-4000-8000-000000000001'),
  0::bigint,
  'another user cannot read an owner profile'
);

select is(
  (select count(*) from public.parties where id = '00000000-0000-4000-8000-000000000011'),
  0::bigint,
  'another user cannot read an owner party'
);

select is(
  (select count(*) from public.party_plans where id = '00000000-0000-4000-8000-000000000021'),
  0::bigint,
  'another user cannot read an owner party plan'
);

select is(
  (
    with updated as (
      update public.party_plans
      set location = 'Tallinn'
      where id = '00000000-0000-4000-8000-000000000021'
      returning id
    )
    select count(*) from updated
  ),
  0::bigint,
  'another user cannot update an owner plan'
);

select throws_ok(
  $$insert into public.parties (owner_id, title)
    values ('00000000-0000-4000-8000-000000000001', 'Võõras plaan')$$,
  '42501',
  null,
  'another user cannot create a party for an owner'
);

select * from finish();
rollback;
