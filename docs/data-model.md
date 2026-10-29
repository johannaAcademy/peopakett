# Andmebaasi esialgne ER-mudel

## 1. Võtmevaldkonnad

- profiles
- user_roles
- parties
- party_plans
- themes
- theme_assets
- catalog_products
- pricing_rules
- party_plan_items
- orders
- order_items
- payments
- entitlements
- party_websites
- rsvp_responses
- suppliers
- supplier_services
- supplier_inquiries
- deliveries
- email_events
- audit_logs

## 2. Seoste põhimõte

- profiles 1:N parties
- profiles 1:N party_plans
- party_plans 1:N party_plan_items
- themes 1:N theme_assets
- catalog_products 1:N pricing_rules
- party_plans 1:N orders
- orders 1:N order_items
- orders 1:N payments
- orders 1:N entitlements
- party_plans 1:1 party_websites
- party_websites 1:N rsvp_responses
- suppliers 1:N supplier_services
- suppliers 1:N supplier_inquiries
- orders 1:N deliveries
- users 1:N audit_logs

## 3. Skeemipõhimõte

### profiles
- id UUID PK
- supabase_auth_user_id UUID UNIQUE NOT NULL
- full_name TEXT
- email TEXT UNIQUE NOT NULL
- role TEXT CHECK (role IN ('customer','supplier','admin'))
- created_at timestamptz NOT NULL
- updated_at timestamptz NOT NULL

### party_plans
- id UUID PK
- profile_id UUID FK -> profiles.id
- title TEXT NOT NULL
- status TEXT CHECK (...) NOT NULL
- event_type TEXT
- target_age_group TEXT
- guest_count INT
- budget_total NUMERIC(12,2)
- currency TEXT NOT NULL
- data JSONB
- created_at timestamptz NOT NULL
- updated_at timestamptz NOT NULL

### party_plan_items
- id UUID PK
- party_plan_id UUID FK -> party_plans.id
- item_type TEXT CHECK (...) NOT NULL
- item_ref UUID
- title TEXT NOT NULL
- quantity NUMERIC(10,2)
- unit_price NUMERIC(12,2)
- total_price NUMERIC(12,2)
- pricing_model TEXT
- status TEXT
- created_at timestamptz NOT NULL

### orders
- id UUID PK
- profile_id UUID FK -> profiles.id
- order_number TEXT UNIQUE NOT NULL
- status TEXT CHECK (...) NOT NULL
- subtotal NUMERIC(12,2) NOT NULL
- tax_total NUMERIC(12,2)
- shipping_total NUMERIC(12,2)
- total NUMERIC(12,2) NOT NULL
- currency TEXT NOT NULL
- payment_status TEXT NOT NULL
- created_at timestamptz NOT NULL
- updated_at timestamptz NOT NULL

### order_items
- id UUID PK
- order_id UUID FK -> orders.id
- product_id UUID
- title TEXT NOT NULL
- quantity NUMERIC(10,2) NOT NULL
- unit_price_snapshot NUMERIC(12,2) NOT NULL
- total_price_snapshot NUMERIC(12,2) NOT NULL
- currency TEXT NOT NULL
- tax_snapshot JSONB
- created_at timestamptz NOT NULL

### payments
- id UUID PK
- order_id UUID FK -> orders.id
- provider TEXT NOT NULL
- provider_intent_id TEXT
- provider_payment_id TEXT
- status TEXT CHECK (...) NOT NULL
- amount NUMERIC(12,2) NOT NULL
- currency TEXT NOT NULL
- webhook_payload JSONB
- created_at timestamptz NOT NULL

### party_websites
- id UUID PK
- party_plan_id UUID FK -> party_plans.id UNIQUE
- public_slug TEXT UNIQUE NOT NULL
- title TEXT NOT NULL
- status TEXT CHECK (...) NOT NULL
- published_at timestamptz
- created_at timestamptz NOT NULL
- updated_at timestamptz NOT NULL

### rsvp_responses
- id UUID PK
- party_website_id UUID FK -> party_websites.id
- guest_name TEXT NOT NULL
- attending BOOLEAN NOT NULL
- guests_count INT NOT NULL DEFAULT 0
- response_data JSONB
- created_at timestamptz NOT NULL
- UNIQUE (party_website_id, guest_name)

### suppliers
- id UUID PK
- company_name TEXT NOT NULL
- service_type TEXT
- region TEXT
- contact_email TEXT
- contact_phone TEXT
- status TEXT CHECK (...)
- created_at timestamptz NOT NULL

### supplier_inquiries
- id UUID PK
- profile_id UUID FK -> profiles.id
- supplier_id UUID FK -> suppliers.id
- status TEXT CHECK (...) NOT NULL
- subject TEXT NOT NULL
- message TEXT NOT NULL
- quote_json JSONB
- sent_at timestamptz
- created_at timestamptz NOT NULL

### audit_logs
- id UUID PK
- entity_type TEXT NOT NULL
- entity_id UUID NOT NULL
- actor_profile_id UUID FK -> profiles.id
- action TEXT NOT NULL
- diff JSONB
- created_at timestamptz NOT NULL

## 4. Indeksid

- party_plans(profile_id, status)
- party_plan_items(party_plan_id, item_type)
- orders(profile_id, status)
- order_items(order_id)
- payments(order_id, status)
- party_websites(public_slug)
- rsvp_responses(party_website_id, created_at)
- supplier_inquiries(supplier_id, status)
- audit_logs(entity_type, entity_id, created_at)

## 5. Käsitlusnõuded

- vajalik on säilitada hinnasnapshot tellimuse real;
- maksekaardiandmeid ei tohi talletada;
- tellimuse muutused tuleb logida audit_logs tabelisse;
- soft delete on soovitav väärtuslikematele andmetele, kuid mitte kohustuslik esmaversioonis.

## 6. Etapi 4 rakendatud skeem

Migratsioon `supabase/migrations/20261029120000_auth_profiles_and_party_drafts.sql` loob praegu:

- `profiles`: kasutaja UUID viitab `auth.users.id` väärtusele; kasutaja saab lugeda enda profiili ja muuta ainult `full_name` välja;
- `parties`: sündmuse pealkiri ja omanik;
- `party_plans`: sündmuse tingimused, eelarve täissentides, EUR-valuuta ja planeerija lisainfo JSONB väljal.

`save_party_draft` on `SECURITY INVOKER` RPC, mis loob sündmuse ja plaani sama andmebaasitehingu sees või uuendab olemasolevat omanikule kuuluvat mustandit. Omaniku ID võetakse `auth.uid()` väärtusest, mitte brauseri payloadist. RPC täitmine on antud ainult `authenticated` rollile.

Igal kasutajaandmeid sisaldaval tabelil on RLS. Planeerija kuluread on hetkel JSONB-s, sest need on hinnangulised mustandivalikud; nende põhjal ei looda tellimusi ega kinnitata hindu. Tellimuse rea hinnasnapshot ja serveripoolne hinnakinnitus lisatakse hilisemas etapis.

`supabase/tests/rls.test.sql` sisaldab pgTAP-teste, mis kontrollivad profiili, sündmuse ja plaani omandiõigust ning võõra andme muutmise/loomise blokeerimist.
