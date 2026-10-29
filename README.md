# Moodne peopakett

Eestikeelne peo planeerimise veebirakendus. Rakendus on arendamisel Vue 3, TypeScripti ja Vite'iga.

## Alustamine

```sh
npm install
npx supabase start
npm run dev
```

Kohalik Supabase väljastab API URL-i ja anon-võtme käsuga `npx supabase status`. Kopeeri need
oma kohalikku `.env` faili vastavalt `.env.example` muutujatele:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=local-anon-key
```

`.env` on gitist välja jäetud. Frontendis kasuta ainult avalikku anon-võtit; `service_role` võtit
ei tohi kunagi `VITE_` muutujasse panna ega brauserisse saata. Supabase peab olema seadistatud
RLS-reeglitega.

Arenduskeskkonna omandiõiguse testid:

```sh
npm run test:db
```

Peata kohalikud teenused käsuga `npx supabase stop`.

## Kontrollid

```sh
npm run lint
npm run build
npm run test
```

## Arendusstaatus

- Etapid 0–1: arhitektuuri kavand ja rakenduse alus.
- Etapp 2: avalik avaleht koos teemade, pakettide, teenuste, KKK ja illustratiivse eelarvejaotusega.
- Etapp 3: kuueastmeline brauseripõhine planeerija ja sendipõhine eelarve eelvaade.
- Etapp 4: Supabase Auth, profiil ning RLS-iga kaitstud mustandite salvestus ja laadimine.
- Serveripoolne hinnakinnitus, tellimused, maksed ja RSVP pole veel ühendatud.

Arhitektuur, andmemudel, turvariskid ja etapid on kirjas kaustas [docs](./docs/).
