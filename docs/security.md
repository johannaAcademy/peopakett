# Turvatud andmetöötlus ja riskid

## 1. Põhikontrollid

- TypeScript strict mode on lubatud.
- Frontend sisaldab ainult avalikke andmeid ja ei saa salajasi väärtusi.
- Kõik sensitiivsed toimingud kontrollitakse serveripoolselt.
- Supabase RLS on määratud andmetele, mis sisaldavad kasutaja või tellimuse konteksti.
- Maksete kinnitamine toimub webhooki kaudu ja ei tohi sõltuda frontend inputidest.

## 2. Riskide nimekiri ja leevendused

1. Autoriseerimise ja autentimise ebaõige rakendamine
   - Risk: kasutaja pääseb teiste kasutajate andmetele ligi.
   - Leevendus: Supabase Auth, RLS, profile_id kontroll ja serveripoolne kontroll kõigis admin ja order operatsioonides.

2. Frontendis modifitseeritavel hinnadel ja õigustel põhinevad operatsioonid
   - Risk: klient saab endale anda tasuta tooteid või admin õigusi.
   - Leevendus: serverikontroll, tootemäärajaid ja entitlements ainult serveris.

3. Webhooki ja makse idempotentse käsitluse puudumine
   - Risk: topelt-tellimus või topelt-makse.
   - Leevendus: idempotency key, uuid, webhook signature validation, dedupe andmebaasis.

4. RSVP ja avalikud lehed
   - Risk: andmete lekkimine või võltsitud vastused.
   - Leevendus: avaliku URL-i privaatsus, harjutuslik CAPTCHA/Bot protection, serveripoolne validatsioon ja kasutaja päringute limiit.

5. XSS ja HTML injection
   - Risk: kasutaja sisestatud tekst renderdatakse avalike lehtede kaudu.
   - Leevendus: sanitization, escape, HTML renderimise piirang, Zod schema validation.

6. Pildid ja failid
   - Risk: kasutaja laadib avalikuks mõeldud failid, mis sisaldavad ohtlikku sisu.
   - Leevendus: private bucket, signed URLs, eraldi avalikule sisule loodud raja.

7. Võõrvõrgu ja andmete logimine
   - Risk: isikuandmete või tokenide lekkimine logidesse.
   - Leevendus: logimine peab olema kontrollitud, ilma privaatsete andmeteta.

## 3. Soovitatud reeglid

- Kõik asünkroonsed ja serveri poolse loogikaga funktsioonid peavad olema idempotentsed.
- Üheselt kontrollitakse webhooki signatuurid ja järjestus.
- Kui makse on ebaõnnestunud, ei avata tasulist sisu.
- Päringute ja RSVP vastuste piiranguid kontrollitakse nii serveris kui kasutajaliideses.
- Admin role'i muutmine tuleb eraldada serveriga ja pole frontendile lubatud.

## 4. Testimise ja auditi nõuded

- RLS poliitikatest tuleb testida vähemalt kasutaja ja admin rollid.
- Webhook testid on kohustuslikud.
- Testi assigneering tuleb teha enne tootmisse minekut.

## 5. Etapi 4 rakendatud kontrollid ja piirangud

- Profiil, sündmused ja peoplaanid kasutavad RLS-i ning omanikukontrolli.
- Profiili muutmisel on `authenticated` rollil andmebaasis `UPDATE` õigus ainult `full_name` veerule.
- `save_party_draft` on `SECURITY INVOKER`; see ei kasuta service-role võtmeid ega väldi RLS-i.
- Uue Auth kasutaja profiil luuakse andmebaasi triggeriga; kasutaja ei saa ise profiili ID-d määrata.
- RPC payloadi ja salvestatud kuluridade maht on piiratud. DB piirangud kontrollivad väljade ulatust ning olekuid.
- Frontend kasutab ainult `VITE_SUPABASE_URL` ja avalikku anon-võtit. Service-role võtit ei tohi panna `VITE_` muutujasse.

RLS testid on kirjeldatud `supabase/tests/rls.test.sql` failis. Need tuleb käivitada kohaliku Supabase’i vastu käsuga `npm run test:db`; poliitikaid ei tohi lugeda tootmises kinnitatuks enne testi läbimist ja tootmiskeskkonna konfiguratsiooni ülevaatust.

Makseid, ostuõigusi, serveripoolset hinnakinnitust ega admin rolle see etapp ei käsitle. Salvesta mustandit ainult omaniku nimel ning ära käsitle JSONB hinnanguid usaldatud ostusummadena.
