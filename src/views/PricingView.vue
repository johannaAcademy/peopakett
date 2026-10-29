<template>
  <section class="container page-shell">
    <div class="pricing-page">
      <header class="pricing-intro">
        <p class="eyebrow">Selged hinnad, sinu valikud</p>
        <h1>Võta appi just see, mida sinu pidu vajab.</h1>
        <p class="intro">
          Alusta tasuta inspiratsioonist või lisa oma plaani digitaalne toode, füüsiline peokarp või
          peojuht.
        </p>
      </header>

      <div class="pricing-grid">
        <article class="price-card">
          <span class="offer-tag">Ideede kogumiseks</span>
          <h2>Free Inspiration</h2>
          <p class="price">0 €</p>
          <p>Teemad ja inspiratsioon peo planeerimise alustamiseks.</p>
          <router-link class="button button-secondary" to="/planner">Alusta tasuta</router-link>
        </article>

        <article class="price-card featured">
          <span class="offer-tag">Digitaalne peoplaan</span>
          <h2>Complete Party Plan</h2>
          <p class="price">29 € <span>/ pidu</span></p>
          <ul>
            <li>Personaalne ajakava ja eelarve</li>
            <li>Toidukoguste arvutus ja ostunimekiri</li>
            <li>Mängud ning prinditavad dekoratsioonid ja sildid</li>
            <li>Soovitused ruumide, kostüümide ja teenuste kohta</li>
          </ul>
          <router-link class="button button-primary" to="/planner">Alusta peoplaaniga</router-link>
        </article>

        <article class="price-card">
          <span class="offer-tag">Kutselink ja RSVP</span>
          <h2>Party Website</h2>
          <p class="price">100 € <span>/ peoveeb</span></p>
          <ul>
            <li>Personaalne sündmuse veebileht</li>
            <li>Digitaalne kutselink ja RSVP-vastused</li>
            <li>Külaliste haldamise vaade korraldajale</li>
          </ul>
          <router-link class="button button-secondary" to="/planner">Vaata planeerijat</router-link>
        </article>
      </div>

      <section class="extras" aria-labelledby="extras-title">
        <p class="eyebrow">Soovi korral lisa</p>
        <h2 id="extras-title">Füüsilised tooted ja peopäeva abi</h2>
        <div class="extras-grid">
          <article class="extra-card">
            <h3>Party Box</h3>
            <p>
              Vali peokarpi sobivad tooted. Party Boxi saab tellida ka ilma digitaalse peoplaanita.
            </p>
            <strong>Valitud toodete summa + kohaletoimetamine</strong>
          </article>
          <article class="extra-card">
            <h3>Kostümeeritud peojuht</h3>
            <p>Peojuht alates kolmest tunnist. Saadavus kinnitatakse enne tellimist.</p>
            <strong>50 €/h · miinimum 3 h · baashind alates 150 €</strong>
            <small>Transpordi-, kostüümi- ja materjalikulu võivad lisanduda.</small>
          </article>
          <article class="extra-card">
            <h3>Täisteenus</h3>
            <p>Räägi meile oma peost ja vajadustest, et saaksime teha personaalse pakkumise.</p>
            <strong>Personaalne pakkumine</strong>
          </article>
        </div>
      </section>

      <p class="pricing-note">
        Party Boxi ja teenuste saadavus ning lõplik hind kinnitatakse enne tellimust. Complete Party
        Plan ei sisalda füüsilisi tooteid, kohaletoimetamist ega Party Website'i. Hinnad kuvatakse
        eurodes.
      </p>
    </div>
  </section>
</template>

<style scoped>
.pricing-intro {
  max-width: 720px;
  margin-bottom: 36px;
}

.pricing-intro h1 {
  font-size: clamp(2.5rem, 5vw, 4.2rem);
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.price-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 340px;
  padding: 25px;
}

.price-card h2 {
  margin: 0;
  font-size: 1.35rem;
  letter-spacing: -0.04em;
}

.price-card > p:not(.price) {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.6;
}

.price-card .price {
  margin: 12px 0;
}

.price span {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0;
}

.price-card ul {
  flex: 1;
  padding-left: 20px;
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.7;
}

.price-card .button {
  margin-top: auto;
}

.offer-tag {
  display: inline-block;
  margin-bottom: 18px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #fff2eb;
  color: var(--primary-dark);
  font-size: 0.7rem;
  font-weight: 750;
}

.extras {
  margin-top: 64px;
}

.extras > h2 {
  margin-bottom: 24px;
  font-size: clamp(2rem, 4vw, 3rem);
}

.extras-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.extra-card {
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel);
}

.extra-card h3 {
  font-size: 1.15rem;
}

.extra-card p,
.extra-card small {
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.6;
}

.extra-card strong {
  display: block;
  margin-top: 16px;
  font-size: 0.88rem;
}

.extra-card small {
  display: block;
  margin-top: 7px;
}

.pricing-note {
  margin: 22px 0 0;
  color: var(--muted);
  font-size: 0.85rem;
  line-height: 1.65;
}

@media (max-width: 760px) {
  .pricing-grid,
  .extras-grid {
    grid-template-columns: 1fr;
  }

  .price-card {
    min-height: 0;
  }

  .extras {
    margin-top: 46px;
  }
}
</style>
