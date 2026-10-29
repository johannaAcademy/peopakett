# Etapiviisiline arendusplaan

## Etapp 0: Audit ja arhitektuur

- Projekti analüüs ja tehnilised otsused
- Andmemudeli kavand ja riskide nimekiri
- Turbe- ja ärieelduste dokumenteerimine
- Rakenduse alus ja projektistruktuur

Staatus: valmis. Alusraamistik ja arhitektuuridokumendid on loodud ning kontrollitud.

## Etapp 1: Projekti alus

- TypeScript strict, lint, Prettier, Vite, router, Pinia
- Disainisüsteemi algus
- Smokes tests ja build kontroll

Staatus: valmis. Lint, build ja baastest läbivad.

## Etapp 2: Avalik veeb

- Hero, teemade galerii, planeerimise tutvustus, eelarve näidisjaotus ja CTA-d
- Tootepaketid, Party Box, peojuhi teenus, KKK ja usaldusväärne jalus
- Responsive paigutus, klaviatuurifookus ja vähendatud liikumise tugi
- Avalehe sisu- ja interaktiivse eelarve testi lisamine

Staatus: valmis UI tasemel. Eelarvejaotus on märgitud illustratiivseks. Teemade ja teenuste andmed ei tule veel backendist ning tellimine pole ühendatud.

## Etapp 3: Planeerija ja kalkulaator

- Multi-step planner
- Price model validation
- Budget calculations and pricing logic
- Unit tests for calculator scenarios

Staatus: valmis brauseripõhise eelvaatena. Kuue sammu sisendid valideeritakse, sentide kalkulaator toetab fikseeritud, külalise-, ühiku-, tunni-, alates-, pakkumise- ja kokkuleppepõhist hinda. Rakendus näitab hinnangulisi ning pakkumist vajavaid ridu eraldi. Mustandi salvestamine, serveripoolne hinnakinnitus, maksud ja tarnijate andmed pole selles etapis ühendatud.

## Etapp 4: Andmebaas ja autentimine

- Supabase migrations
- Auth and profile flows
- Drafts and ownership tests

Staatus: rakendatud. Authi, profiili, mustandi loomise/uuendamise/laadimise ning RLS poliitikad on lisatud. Migratsiooni ja pgTAP testide SQL süntaks on kontrollitud; nende käivitamine päris PostgreSQL/Supabase keskkonnas on pooleli, sest kohalik Supabase peatub Realtime'i sisemise migratsiooni ajal andmebaasiühenduse timeout'i tõttu.

## Etapp 5: Tasuline peoplaan

- Order and payment flow
- Server-side validation
- Webhook integration and entitlements

## Etapp 6: Party Website ja RSVP

- Public website editor and public pages
- RSVP privacy rules and guest handling

## Etapp 7: Party Box ja tarnijad

- Catalog, fulfillment, supplier inquiries, quote management

## Etapp 8: Admin ja täisteenus

- Admin dashboard, party host and full service requests

## Etapp 9: Tootmisvalmidus

- Security review, accessibility, tests, SEO, backups, configuration
