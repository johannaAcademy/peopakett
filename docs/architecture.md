# Arhitektuur ja tehnilised otsused

## 1. Praegune seis

Projekt on algusjärgus ja on seadistatud Vue 3 + TypeScript + Vite keskkonnana, mille eesmärk on serveerida Moodne peopakett platvormi aluseid. Põhisisu on dokumenteeritud, rakenduse skelet ja avaleht, planeerija, hinnad ja admin vaated on valmis. Projekt ei ole veel üles ehitatud domain-specific modulaarse funktsioonide hierarhiaga, kuid alus on paigas ja sobib etappi 1 järgmiseks käivitamiseks.

## 2. Soovitatav arhitektuur

### Frontend

- Vue 3 Composition API ja `<script setup lang="ts">`
- Vue Router
- Pinia
- VeeValidate + Zod
- Modulaarne struktuur `src/modules/*` ja `src/components/ui/*`

### Backend ja andmed

- Supabase PostgreSQL + Auth + Storage + Edge Functions
- Serveripoolsed kontrollid kõikide väliste ja tasuliste toimingute eest
- RLS poliitikad kasutajaõiguste ja tundlike andmete jaoks

### Põhimõtted

- modulaarne monoliit, mitte mikroteenused;
- ärireeglid domeeni tasemel, mitte UI komponentides;
- kuller kasutaja ja serveri vahel;
- turva- ja andmete terviklikkuse kontroll serveris;
- hinnad ja õigused ei tohi olla frontendis usalduslikud.

## 3. Modulaarne jaotus

src/

- app/
- router/
- providers/
- modules/
  - auth/
  - parties/
  - planner/
  - themes/
  - pricing/
  - catalog/
  - checkout/
  - orders/
  - websites/
  - rsvp/
  - suppliers/
  - admin/
- components/
- composables/
- lib/
- supabase/
- validation/
- formatting/
- types/
- styles/

## 4. Arhitektuurilised otsused

1. Supabase hoiab kogu andmebaasi ja autentimise infrastruktuuri, sest see sobib kiireks MVP-ga alustamiseks ja annab RLS-i, Storage'i ja Edge Functions'i samas keskkonnas.
2. UI ei tee usalduslikku hinnakalkulatsiooni; frontend on eelvaate ja kasutajakogemuse kiht. Lõpptulemus tuleb serverilt.
3. Domain modules on kasutatavad teema alusel, mitte ühtne "services.ts" fail. See hoiab koodi testitavaks ja väldib hilisema laienemise segadust.
4. Privaatne/avalik andmete eraldamine toimub andmebaasi ja bucket policydega, mitte ainult UI vaadetega.
5. Peoplaan ja eelarvekalkulaator on esialgu lokaliseeritud, kuid hiljem liigutatakse Supabase tabelitesse ja serveri valemitesse.

## 5. Riskid ja leevendus

- Risk: hinnad ja õigused on frontendis manipuleeritavad. Leevendus: serveri kontroll, RLS, makse- ja entitlements andmed serveris.
- Risk: dubleeriv tellimuse loomine. Leevendus: idempotent webhooki käsitlemine, UUID idempotency key, indeksid ja audit log.
- Risk: peoveebi avalik URL ja RSVP privaatsus. Leevendus: kontrollitud avalikustamine, liitint ja RLS.
- Risk: makse ebaõnnestumised ja kaheastmeline kinnitus. Leevendus: webhooki kontroll, maksete olekud, tagasimaksed.
- Risk: teema ja produkt pildid vigaste kasutusõigustega. Leevendus: Storage poliitikad ja kontrollitud allikad.

## 6. Rakenduse hetkeseis

- Etapid 0–1: projektialus ja tehniline dokumentatsioon.
- Etapp 2: avalik veeb koos teemade, pakettide, teenuste, KKK ja näidis-eelarvega.
- Etapp 3: kuueastmeline kliendipoolne planeerija ja sendipõhine eelarve eelvaade.
- Etapp 4: Supabase Auth, profiil ning RLS-iga mustandite salvestus ja laadimine.

Etapi 4 migratsioon ja pgTAP testid asuvad `supabase/` kaustas. Järgmised sammud on tellimuste serveripoolne hinnakinnitus/maksed ning peoveeb/RSVP. Eelarve- ja tootehinnad brauseris ei ole autoriteetsed ostusummad.
