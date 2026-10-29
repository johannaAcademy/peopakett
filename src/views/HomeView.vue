<script setup lang="ts">
import { computed, ref } from 'vue';

const themes = [
  { name: 'Väike seikleja', detail: 'Lastepidu · 4-8 a', art: 'adventure', icon: '✦' },
  { name: 'Piraadilaht', detail: 'Aaretejaht · õues või toas', art: 'pirate', icon: '⚓' },
  { name: 'Wild West', detail: 'Ühine seiklus · igas vanuses', art: 'western', icon: '✺' },
  { name: '90ndate pidu', detail: 'Sõpradega · retrohõnguline', art: 'nineties', icon: '♫' },
  {
    name: 'Õhtusöök küünlavalgel',
    detail: 'Täiskasvanutele · elegantne',
    art: 'dinner',
    icon: '✧',
  },
];

const budget = ref(1000);
const guestCount = ref(20);

const budgetShares = [
  { label: 'Söök ja jook', percent: 35 },
  { label: 'Koht ja ruum', percent: 25 },
  { label: 'Tegevused ja dekoratsioonid', percent: 20 },
  { label: 'Paindlik varu', percent: 20 },
];

const budgetAllocation = computed(() => {
  const totalCents = Math.round(budget.value * 100);
  let allocatedCents = 0;

  return budgetShares.map((share, index) => {
    const cents =
      index === budgetShares.length - 1
        ? totalCents - allocatedCents
        : Math.round((totalCents * share.percent) / 100);
    allocatedCents += cents;

    return { ...share, amount: cents / 100 };
  });
});

const price = (amount: number) =>
  new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);

const budgetPerGuest = computed(() => {
  if (!Number.isInteger(guestCount.value) || guestCount.value < 1 || guestCount.value > 200) {
    return null;
  }

  return budget.value / guestCount.value;
});
</script>

<template>
  <div class="home-page">
    <section class="hero container" aria-labelledby="hero-title">
      <div class="hero-layout">
        <div class="hero-copy">
          <p class="eyebrow">Üks hea pidu algab heast plaanist</p>
          <h1 id="hero-title">Vähem korraldusmuret. Rohkem peomelu.</h1>
          <p class="intro">
            Pane paika teema, külalised ja eelarve. Meie aitame sul muuta peo korraldamise lihtsaks
            ja sinu nägu plaaniks.
          </p>
          <div class="hero-actions">
            <router-link class="button button-primary" to="/planner">
              Alusta peo planeerimist
            </router-link>
            <a class="button button-secondary" href="#how-it-works">Vaata, kuidas see käib</a>
          </div>
          <ul class="hero-promises" aria-label="Peo planeerimise eelised">
            <li><span aria-hidden="true">✓</span> Alusta tasuta</li>
            <li><span aria-hidden="true">✓</span> Konto pole alustamiseks vajalik</li>
            <li><span aria-hidden="true">✓</span> Eelarve jääb sinu kontrolli alla</li>
          </ul>
        </div>

        <div class="hero-art" role="img" aria-label="Peo planeerimise näidisvaade">
          <div class="hero-confetti confetti-one" aria-hidden="true">✦</div>
          <div class="hero-confetti confetti-two" aria-hidden="true">●</div>
          <div class="planner-card">
            <div class="planner-card-head">
              <span class="planner-icon" aria-hidden="true">✳</span>
              <div>
                <span class="mini-label">Sinu peoplaan</span>
                <strong>Suve sünnipäev</strong>
              </div>
              <span class="plan-status">Mustand</span>
            </div>
            <div class="planner-progress">
              <div class="progress-label">
                <span>Planeerimine</span><strong>3 sammu 6-st</strong>
              </div>
              <div
                class="progress-track"
                role="progressbar"
                aria-label="Planeerimisest on tehtud pool"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="50"
              >
                <span />
              </div>
            </div>
            <div class="planner-facts">
              <div><span>Teema</span><strong>Aiaõhtu</strong></div>
              <div><span>Külalisi</span><strong>20 inimest</strong></div>
              <div><span>Eelarve</span><strong>€ 1 000</strong></div>
            </div>
            <p class="planner-note"><span aria-hidden="true">✦</span> Sinu pidu, sinu plaan.</p>
          </div>
          <div class="floating-note">
            <span aria-hidden="true">♡</span> Hästi läbimõeldud, sinu moodi
          </div>
        </div>
      </div>
    </section>

    <section id="themes" class="section container" aria-labelledby="themes-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Ideest algab pidu</p>
          <h2 id="themes-title">Leia oma peo meeleolu</h2>
        </div>
        <router-link class="text-link" to="/planner">
          Avasta teemasid <span aria-hidden="true">→</span>
        </router-link>
      </div>
      <div class="theme-grid">
        <article v-for="theme in themes" :key="theme.name" class="theme-card">
          <div class="theme-art" :class="`theme-art--${theme.art}`" aria-hidden="true">
            <span>{{ theme.icon }}</span>
            <i />
            <b />
          </div>
          <div class="theme-card-copy">
            <h3>{{ theme.name }}</h3>
            <p>{{ theme.detail }}</p>
          </div>
        </article>
      </div>
      <p class="section-note">
        Teemad on inspiratsiooniks — sinu pidu võib kujuneda täpselt omamoodi.
      </p>
    </section>

    <section id="how-it-works" class="section how-section" aria-labelledby="how-title">
      <div class="container">
        <div class="section-heading centered">
          <div>
            <p class="eyebrow">Lihtne algusest lõpuni</p>
            <h2 id="how-title">Kolm sammu peoni</h2>
            <p class="section-intro">Väikesed otsused teevad suure päeva korraldamise kergemaks.</p>
          </div>
        </div>
        <ol class="how-grid">
          <li class="how-card">
            <span class="step-number">01</span>
            <span class="step-icon" aria-hidden="true">✎</span>
            <h3>Räägi, mida tähistad</h3>
            <p>Vali peo tüüp, teema, külaliste arv, kuupäev ja oma eelarve.</p>
          </li>
          <li class="how-card">
            <span class="step-number">02</span>
            <span class="step-icon" aria-hidden="true">✦</span>
            <h3>Koosta endale sobiv plaan</h3>
            <p>Vaata ideid ja pane kokku ajakava, tegevused ning vajalikud ostud.</p>
          </li>
          <li class="how-card">
            <span class="step-number">03</span>
            <span class="step-icon" aria-hidden="true">♡</span>
            <h3>Naudi oma pidu</h3>
            <p>Soovi korral lisa peoveeb, Party Box või peojuhi teenus.</p>
          </li>
        </ol>
      </div>
    </section>

    <section id="budget-example" class="section container" aria-labelledby="budget-title">
      <div class="budget-layout">
        <div class="budget-copy">
          <p class="eyebrow">Hea plaan hoiab pea selge</p>
          <h2 id="budget-title">Sinu eelarve, sinu otsused</h2>
          <p class="section-intro">
            Jaga eelarve osadeks juba planeerimise alguses. Muuda summat, et näha, kuidas
            näidisjaotus muutub. Külaliste arv näitab eelarvet ühe külalise kohta.
          </p>
          <p class="estimate-disclaimer">
            Näidisjaotus on illustratiivne ega ole teenusepakkuja hind ega pakkumine.
          </p>
          <router-link class="text-link" to="/planner">
            Alusta oma plaani <span aria-hidden="true">→</span>
          </router-link>
        </div>
        <div class="budget-card">
          <div class="budget-card-heading">
            <div>
              <span class="mini-label">Näidis-eelarve</span><strong>{{ price(budget) }}</strong>
            </div>
            <span class="budget-badge">Illustratiivne</span>
          </div>
          <div class="budget-controls">
            <label for="budget-range"
              >Kogu eelarve <strong>{{ price(budget) }}</strong></label
            >
            <input
              id="budget-range"
              v-model.number="budget"
              type="range"
              min="300"
              max="3000"
              step="100"
            />
            <div class="range-ends"><span>300 €</span><span>3 000 €</span></div>
            <label for="guest-count">Külaliste arv</label>
            <div class="guest-input-wrap">
              <input
                id="guest-count"
                v-model.number="guestCount"
                type="number"
                min="1"
                max="200"
                required
                aria-describedby="guest-count-hint"
              />
              <span>inimest</span>
            </div>
            <p id="guest-count-hint" class="field-hint">Sisesta täisarv vahemikus 1–200.</p>
          </div>
          <div class="budget-breakdown" aria-live="polite">
            <div v-for="item in budgetAllocation" :key="item.label" class="budget-row">
              <span class="budget-dot" aria-hidden="true" />
              <span class="budget-label">{{ item.label }}</span>
              <span class="budget-amount">{{ price(item.amount) }}</span>
            </div>
          </div>
          <div class="per-guest">
            <span>Planeeritud eelarve külalise kohta</span>
            <strong>{{ budgetPerGuest === null ? '—' : price(budgetPerGuest) }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section id="pricing" class="section pricing-section" aria-labelledby="pricing-title">
      <div class="container">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Vali endale sobiv abi</p>
            <h2 id="pricing-title">Alusta tasuta, lisa ainult vajalik</h2>
          </div>
          <router-link class="text-link" to="/pricing">
            Kõik hinnad <span aria-hidden="true">→</span>
          </router-link>
        </div>
        <div class="offer-grid">
          <article class="offer-card">
            <span class="offer-tag">Ideede kogumiseks</span>
            <h3>Free Inspiration</h3>
            <p class="offer-price">0 €</p>
            <p>Sirvi teemasid ja kogu inspiratsiooni oma peo jaoks.</p>
            <router-link class="button button-secondary" to="/planner">Alusta tasuta</router-link>
          </article>
          <article class="offer-card offer-card-featured">
            <span class="offer-tag">Digitaalne toode</span>
            <h3>Complete Party Plan</h3>
            <p class="offer-price">29 € <span>/ pidu</span></p>
            <p>Ajakava, eelarve, toidukogused, ostunimekiri, mängud ja prinditavad materjalid.</p>
            <router-link class="button button-primary" to="/planner">Loo oma peoplaan</router-link>
          </article>
          <article class="offer-card">
            <span class="offer-tag">Kutse ja külalisteleht</span>
            <h3>Party Website</h3>
            <p class="offer-price">100 € <span>/ peoveeb</span></p>
            <p>Personaalne peoveeb, kutselink ja RSVP-vastuste haldamine.</p>
            <router-link class="button button-secondary" to="/pricing">Vaata lähemalt</router-link>
          </article>
        </div>
        <p class="section-note">
          Peoplaan ja peoveeb on eraldi tooted. Peoveeb ei kuulu 29 € plaani sisse.
        </p>
      </div>
    </section>

    <section id="services" class="section container" aria-labelledby="services-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Kui soovid veel rohkem tuge</p>
          <h2 id="services-title">Peo jaoks valmis lisad</h2>
        </div>
      </div>
      <div class="service-grid">
        <article class="service-card box-card">
          <span class="service-icon" aria-hidden="true">▧</span>
          <div>
            <p class="eyebrow">Vali, mida vajad</p>
            <h3>Party Box</h3>
            <p>
              Pane kokku füüsiline peokarp valitud toodetest. Hind sõltub sisust ja
              kohaletoimetamisest.
            </p>
            <p class="service-price">Tooted + kohaletoimetamine</p>
            <router-link class="text-link" to="/planner">
              Vaata võimalusi <span aria-hidden="true">→</span>
            </router-link>
          </div>
        </article>
        <article class="service-card host-card">
          <span class="service-icon" aria-hidden="true">✺</span>
          <div>
            <p class="eyebrow">Jäta melu professionaalile</p>
            <h3>Kostümeeritud peojuht</h3>
            <p>
              Peojuht alates kolmest tunnist. Transpordi-, kostüümi- ja materjalikulu võivad
              lisanduda.
            </p>
            <p class="service-price">50 €/h · miinimum 3 h</p>
            <router-link class="text-link" to="/pricing">
              Küsi saadavust <span aria-hidden="true">→</span>
            </router-link>
          </div>
        </article>
      </div>
      <p class="service-disclaimer">
        Teenuste saadavus ja lõplik hind kinnitatakse enne tellimust.
      </p>
    </section>

    <section class="section faq-section" aria-labelledby="faq-title">
      <div class="container faq-layout">
        <div>
          <p class="eyebrow">Hea teada</p>
          <h2 id="faq-title">Korduma kippuvad küsimused</h2>
          <p class="section-intro">
            Selged vastused, et saaksid rahulikult planeerimisega alustada.
          </p>
        </div>
        <div class="faq-list">
          <details>
            <summary>Kas saan planeerimist alustada kontot loomata?</summary>
            <p>
              Inspiratsiooni ja teemadega saab tutvuda ilma kontota. Konto loomine ja plaani
              salvestamine lisanduvad hilisemas arendusetapis.
            </p>
          </details>
          <details>
            <summary>Mida sisaldab 29 € Complete Party Plan?</summary>
            <p>
              See sisaldab personaalset ajakava, eelarvet, toidukoguste arvutust, ostunimekirja,
              mänge ja prinditavaid materjale. Füüsilised tooted, tarne ja peoveeb ei kuulu paketti.
            </p>
          </details>
          <details>
            <summary>Kas peoveeb kuulub peoplaani sisse?</summary>
            <p>
              Ei. Party Website on eraldi 100 € toode, mis sisaldab kutselinki, sündmuse infot ja
              RSVP-vastuste haldust.
            </p>
          </details>
          <details>
            <summary>Kas Party Box või peojuht on kohe kinnitatud?</summary>
            <p>
              Ei. Party Boxi saadavus ning peojuhi aeg ja lõplik hind kinnitatakse eraldi enne
              tellimuse kinnitamist.
            </p>
          </details>
          <details>
            <summary>Kas tarnijate hinnad on kalkulaatoris lõplikud?</summary>
            <p>
              Ei. Tarnijate hinnad ja saadavus võivad muutuda. Kinnitust vajavad teenused märgitakse
              eraldi ning broneering kehtib alles pärast kinnitamist.
            </p>
          </details>
        </div>
      </div>
    </section>

    <section class="closing-cta container" aria-labelledby="closing-title">
      <div>
        <p class="eyebrow">Sinu järgmine hea pidu algab siit</p>
        <h2 id="closing-title">Teeme plaani, mille järgi on mõnus pidu pidada.</h2>
      </div>
      <router-link class="button button-primary" to="/planner">Alusta peo planeerimist</router-link>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  overflow: hidden;
}

.hero {
  padding-top: 68px;
  padding-bottom: 48px;
}

.hero-layout,
.budget-layout,
.faq-layout {
  display: grid;
  grid-template-columns: 1fr 0.9fr;
  align-items: center;
  gap: clamp(36px, 7vw, 88px);
}

.hero-copy h1 {
  max-width: 650px;
  font-size: clamp(3rem, 6vw, 5.3rem);
  line-height: 0.98;
}

.hero-copy .intro {
  max-width: 570px;
  margin-bottom: 0;
  font-size: 1.1rem;
}

.hero-actions {
  margin: 28px 0 24px;
}

.hero-promises {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  padding: 0;
  list-style: none;
  color: var(--muted);
  font-size: 0.88rem;
}

.hero-promises li {
  display: flex;
  align-items: center;
  gap: 7px;
}

.hero-promises li span {
  color: #43856a;
  font-weight: 800;
}

.hero-art {
  position: relative;
  display: grid;
  min-height: 430px;
  place-items: center;
  border-radius: 48% 52% 45% 55% / 49% 42% 58% 51%;
  background:
    radial-gradient(circle at 75% 22%, #ffe1c9 0 8%, transparent 8.5%),
    radial-gradient(circle at 17% 74%, #f8d5c9 0 5%, transparent 5.5%),
    linear-gradient(145deg, #f8e9de, #ffe9d5 52%, #f9d1c5);
}

.planner-card {
  position: relative;
  width: min(390px, calc(100% - 44px));
  padding: 26px;
  border: 1px solid rgba(88, 59, 45, 0.1);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 25px 65px rgba(90, 50, 29, 0.15);
  transform: rotate(-2deg);
}

.planner-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.planner-card-head > div {
  display: grid;
  gap: 4px;
  flex: 1;
}

.planner-icon,
.step-icon,
.service-icon {
  display: grid;
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 15px;
  background: #fff0e7;
  color: var(--primary-dark);
  font-size: 1.35rem;
}

.mini-label {
  color: var(--muted);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.planner-card-head strong {
  font-size: 1.05rem;
}

.plan-status,
.budget-badge {
  padding: 6px 9px;
  border-radius: 999px;
  background: #f5f0ec;
  color: #665c57;
  font-size: 0.7rem;
  font-weight: 700;
}

.planner-progress {
  margin: 26px 0 18px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 9px;
  color: var(--muted);
  font-size: 0.78rem;
}

.progress-label strong {
  color: var(--text);
}

.progress-track {
  height: 8px;
  overflow: hidden;
  border-radius: 99px;
  background: #f1e8e2;
}

.progress-track span {
  display: block;
  width: 50%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--primary), #ffbd87);
}

.planner-facts {
  display: grid;
  gap: 9px;
}

.planner-facts div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 15px;
  border: 1px solid var(--line);
  border-radius: 13px;
  font-size: 0.88rem;
}

.planner-facts span {
  color: var(--muted);
}

.planner-note {
  margin: 18px 0 0;
  color: var(--primary-dark);
  font-size: 0.84rem;
  font-weight: 700;
}

.hero-confetti {
  position: absolute;
  color: #c65e43;
}

.confetti-one {
  top: 16%;
  right: 12%;
  font-size: 2rem;
}

.confetti-two {
  bottom: 17%;
  left: 8%;
  font-size: 1.1rem;
}

.floating-note {
  position: absolute;
  right: -9px;
  bottom: 32px;
  padding: 13px 17px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 12px 30px rgba(90, 50, 29, 0.12);
  font-size: 0.78rem;
  font-weight: 700;
}

.floating-note span {
  margin-right: 5px;
  color: var(--primary-dark);
}

.section {
  padding-top: 70px;
  padding-bottom: 70px;
  scroll-margin-top: 96px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 24px;
  margin-bottom: 28px;
}

.section-heading h2,
.budget-copy h2,
.faq-layout h2,
.closing-cta h2 {
  max-width: 650px;
  margin-bottom: 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
}

.section-heading .eyebrow,
.budget-copy .eyebrow,
.service-card .eyebrow {
  margin-bottom: 11px;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--primary-dark);
  font-weight: 750;
  text-decoration: none;
}

.text-link:hover span {
  transform: translateX(3px);
}

.text-link span {
  transition: transform 0.18s ease;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.theme-card {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--panel);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.theme-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 34px rgba(71, 36, 23, 0.09);
}

.theme-art {
  position: relative;
  display: grid;
  min-height: 152px;
  overflow: hidden;
  place-items: center;
}

.theme-art > span {
  position: relative;
  z-index: 1;
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.56);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.54);
  color: #493a35;
  font-size: 2rem;
  backdrop-filter: blur(6px);
}

.theme-art i,
.theme-art b {
  position: absolute;
  display: block;
  border: 1px solid rgba(255, 255, 255, 0.44);
  border-radius: 50%;
}

.theme-art i {
  width: 180px;
  height: 180px;
  right: -54px;
  bottom: -116px;
}

.theme-art b {
  width: 120px;
  height: 120px;
  top: -72px;
  left: -28px;
}

.theme-art--adventure {
  background: linear-gradient(135deg, #b6cba8, #e7c894 60%, #f8d6a5);
}

.theme-art--pirate {
  background: linear-gradient(145deg, #a4c7c7, #507d85 56%, #f3c68d);
}

.theme-art--western {
  background: linear-gradient(145deg, #e4ad76, #bb765c 60%, #f0d0a6);
}

.theme-art--nineties {
  background: linear-gradient(145deg, #f4a8ba, #b4a1db 55%, #91d4d1);
}

.theme-art--dinner {
  background: linear-gradient(145deg, #a7a78a, #59645d 55%, #d2b178);
}

.theme-card-copy {
  padding: 16px;
}

.theme-card-copy h3,
.how-card h3,
.offer-card h3,
.service-card h3 {
  margin-bottom: 7px;
  font-size: 1.08rem;
  letter-spacing: -0.035em;
}

.theme-card-copy p,
.how-card p,
.offer-card > p:not(.offer-price),
.service-card p:not(.eyebrow, .service-price) {
  margin: 0;
  color: var(--muted);
  font-size: 0.84rem;
  line-height: 1.55;
}

.section-note,
.service-disclaimer {
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 0.82rem;
}

.how-section,
.faq-section {
  background: #fff4ed;
}

.centered {
  justify-content: center;
  text-align: center;
}

.centered .section-intro {
  margin: 12px 0 0;
}

.section-intro {
  max-width: 600px;
  color: var(--muted);
  line-height: 1.7;
}

.how-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin: 34px 0 0;
  padding: 0;
  list-style: none;
}

.how-card {
  position: relative;
  padding: 26px;
  border: 1px solid rgba(35, 31, 32, 0.07);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.78);
}

.step-number {
  position: absolute;
  top: 25px;
  right: 25px;
  color: #a59a94;
  font-size: 0.75rem;
  font-weight: 800;
}

.step-icon {
  margin-bottom: 22px;
}

.how-card p {
  max-width: 280px;
  font-size: 0.92rem;
}

.budget-layout {
  grid-template-columns: 0.8fr 1fr;
}

.budget-copy .section-intro {
  margin: 20px 0 14px;
}

.estimate-disclaimer {
  max-width: 430px;
  margin-bottom: 24px;
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.6;
}

.budget-card {
  padding: 26px;
  border: 1px solid var(--line);
  border-radius: 25px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.budget-card-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-bottom: 19px;
  border-bottom: 1px solid var(--line);
}

.budget-card-heading > div {
  display: grid;
  gap: 5px;
}

.budget-card-heading strong {
  font-size: 2rem;
  letter-spacing: -0.06em;
}

.budget-controls {
  display: grid;
  gap: 10px;
  padding: 20px 0 17px;
}

.budget-controls label {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--text);
  font-size: 0.84rem;
  font-weight: 700;
}

.budget-controls input[type='range'] {
  width: 100%;
  accent-color: var(--primary-dark);
}

.range-ends {
  display: flex;
  justify-content: space-between;
  color: var(--muted);
  font-size: 0.73rem;
}

.guest-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 0.82rem;
}

.guest-input-wrap input {
  width: 90px;
  padding: 9px 10px;
  border: 1px solid #d9cfca;
  border-radius: 10px;
  color: var(--text);
  font: inherit;
}

.field-hint {
  margin: 0;
  color: var(--muted);
  font-size: 0.73rem;
}

.budget-breakdown {
  display: grid;
  gap: 14px;
  padding: 17px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.budget-row {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  align-items: center;
  gap: 10px;
  font-size: 0.84rem;
}

.budget-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--primary);
}

.budget-row:nth-child(2) .budget-dot {
  background: #e6b274;
}

.budget-row:nth-child(3) .budget-dot {
  background: #9daf9a;
}

.budget-row:nth-child(4) .budget-dot {
  background: #a89ac1;
}

.budget-label {
  color: var(--muted);
}

.budget-amount {
  font-weight: 700;
}

.per-guest {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 17px;
  font-size: 0.82rem;
}

.per-guest span {
  color: var(--muted);
}

.pricing-section {
  background: #fff8f4;
}

.offer-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.offer-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 330px;
  padding: 25px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: #fff;
}

.offer-card-featured {
  border-color: rgba(233, 101, 63, 0.35);
  box-shadow: 0 18px 40px rgba(71, 36, 23, 0.08);
}

.offer-tag {
  margin-bottom: 19px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #fff2eb;
  color: var(--primary-dark);
  font-size: 0.7rem;
  font-weight: 750;
}

.offer-price {
  margin: 7px 0 12px;
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: -0.06em;
}

.offer-price span {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0;
}

.offer-card > p:not(.offer-price) {
  min-height: 66px;
  margin-bottom: 22px;
}

.offer-card .button {
  margin-top: auto;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.service-card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 26px;
  border: 1px solid var(--line);
  border-radius: 22px;
}

.box-card {
  background: #f1f3eb;
}

.host-card {
  background: #f9ece6;
}

.service-card .service-icon {
  width: 54px;
  height: 54px;
}

.service-card h3 {
  font-size: 1.3rem;
}

.service-price {
  margin: 15px 0;
  font-size: 0.88rem;
  font-weight: 800;
}

.faq-layout {
  grid-template-columns: 0.7fr 1fr;
  align-items: start;
}

.faq-layout h2 {
  margin-bottom: 18px;
}

.faq-list {
  border-top: 1px solid rgba(35, 31, 32, 0.12);
}

.faq-list details {
  border-bottom: 1px solid rgba(35, 31, 32, 0.12);
}

.faq-list summary {
  position: relative;
  padding: 19px 30px 19px 0;
  cursor: pointer;
  font-weight: 750;
  line-height: 1.5;
  list-style: none;
}

.faq-list summary::-webkit-details-marker {
  display: none;
}

.faq-list summary::after {
  position: absolute;
  top: 18px;
  right: 3px;
  content: '+';
  color: var(--primary-dark);
  font-size: 1.2rem;
}

.faq-list details[open] summary::after {
  content: '−';
}

.faq-list details p {
  max-width: 650px;
  margin: -3px 25px 18px 0;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.65;
}

.closing-cta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
  margin-top: 64px;
  margin-bottom: 64px;
  padding: clamp(28px, 5vw, 54px);
  border-radius: 30px;
  background: linear-gradient(120deg, #fae7da, #f8d7c8 60%, #f4e3cc);
}

.closing-cta .eyebrow {
  margin-bottom: 12px;
}

.closing-cta h2 {
  max-width: 600px;
}

@media (max-width: 900px) {
  .theme-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .hero-layout,
  .budget-layout,
  .faq-layout {
    grid-template-columns: 1fr 1fr;
    gap: 34px;
  }

  .floating-note {
    right: 0;
  }
}

@media (max-width: 680px) {
  .hero {
    padding-top: 42px;
  }

  .hero-layout,
  .budget-layout,
  .faq-layout {
    grid-template-columns: 1fr;
  }

  .hero-copy h1 {
    font-size: clamp(2.7rem, 13vw, 4.3rem);
  }

  .hero-art {
    min-height: 360px;
    margin: 8px 10px 0;
  }

  .floating-note {
    right: -8px;
    bottom: 20px;
  }

  .section {
    padding-top: 52px;
    padding-bottom: 52px;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }

  .theme-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .theme-art {
    min-height: 125px;
  }

  .theme-card-copy {
    padding: 13px;
  }

  .how-grid,
  .offer-grid,
  .service-grid {
    grid-template-columns: 1fr;
  }

  .offer-card {
    min-height: 0;
  }

  .offer-card > p:not(.offer-price) {
    min-height: 0;
  }

  .closing-cta {
    align-items: flex-start;
    flex-direction: column;
    margin-top: 36px;
    margin-bottom: 40px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
