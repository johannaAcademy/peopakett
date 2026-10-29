begin;

select plan(13);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  confirmed_at,
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

select is(
  (select full_name from public.profiles where id = '00000000-0000-4000-8000-000000000001'),
  'Plaanide omanik',
  'a profile is created from new user metadata'
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

update public.profiles
set full_name = 'Uuendatud nimi'
where id = '00000000-0000-4000-8000-000000000001';

select is(
  (select full_name from public.profiles where id = '00000000-0000-4000-8000-000000000001'),
  'Uuendatud nimi',
  'an owner can update their profile'
);

select is(
  (select count(*) from public.party_plans where id = '00000000-0000-4000-8000-000000000021'),
  1::bigint,
  'an owner can read their party plan'
);

select lives_ok(
  $$select public.save_party_draft(
    null,
    jsonb_build_object(
      'title', 'RPC mustand',
      'partyType', 'birthday',
      'audience', 'children',
      'ageGroup', '6–12 aastat',
      'theme', 'pirate',
      'guestCount', 8,
      'eventDate', (current_date + 14)::text,
      'eventTime', '14:00',
      'location', 'Tartu',
      'venueType', 'indoor',
      'budgetCents', 50000,
      'customTheme', '',
      'venueNeed', 'have-venue',
      'priorities', jsonb_build_array('food'),
      'costs', '[]'::jsonb
    )
  )$$,
  'an owner can save a draft through the RPC'
);

select lives_ok(
  $$select public.save_party_draft(
    '00000000-0000-4000-8000-000000000021',
    jsonb_build_object(
      'title', 'Uuendatud sünnipäev',
      'partyType', 'birthday',
      'audience', 'children',
      'ageGroup', '6–12 aastat',
      'theme', 'pirate',
      'guestCount', 12,
      'eventDate', (current_date + 7)::text,
      'eventTime', '12:00',
      'location', 'Tartu',
      'venueType', 'indoor',
      'budgetCents', 100000,
      'customTheme', '',
      'venueNeed', 'have-venue',
      'priorities', jsonb_build_array('food'),
      'costs', '[]'::jsonb
    )
  )$$,
  'an owner can update their draft through the RPC'
);

select is(
  (select title from public.parties where id = '00000000-0000-4000-8000-000000000011'),
  'Uuendatud sünnipäev',
  'saving a draft updates its party title'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';

select is(
  (select count(*) from public.profiles where id = '00000000-0000-4000-8000-000000000001'),
  0::bigint,
  'another user cannot read an owner profile'
);

update public.profiles
set full_name = 'Võõras nimi'
where id = '00000000-0000-4000-8000-000000000001';

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';

select is(
  (select full_name from public.profiles where id = '00000000-0000-4000-8000-000000000001'),
  'Uuendatud nimi',
  'another user cannot update an owner profile'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';

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

update public.party_plans
set location = 'Tallinn'
where id = '00000000-0000-4000-8000-000000000021';

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';

select is(
  (select location from public.party_plans where id = '00000000-0000-4000-8000-000000000021'),
  'Tartu',
  'another user cannot update an owner plan'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';

select throws_ok(
  $$select public.save_party_draft(
    '00000000-0000-4000-8000-000000000021',
    jsonb_build_object(
      'title', 'Võõras uuendus',
      'partyType', 'birthday',
      'audience', 'children',
      'ageGroup', '6–12 aastat',
      'theme', 'pirate',
      'guestCount', 12,
      'eventDate', (current_date + 7)::text,
      'eventTime', '12:00',
      'location', 'Tartu',
      'venueType', 'indoor',
      'budgetCents', 100000,
      'customTheme', '',
      'venueNeed', 'have-venue',
      'priorities', jsonb_build_array('food'),
      'costs', '[]'::jsonb
    )
  )$$,
  '42501',
  null,
  'another user cannot update an owner draft through the RPC'
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
