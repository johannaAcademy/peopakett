<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <div class="container nav-wrap">
        <router-link to="/" class="brand" aria-label="Moodne peopakett avaleht">
          <span class="brand-mark">M</span>
          <span>Moodne peopakett</span>
        </router-link>

        <nav class="main-nav" aria-label="Põhimenüü">
          <router-link to="/#themes">Teemad</router-link>
          <router-link to="/#how-it-works">Kuidas toimib</router-link>
          <router-link to="/planner">Planeerija</router-link>
          <router-link to="/#pricing">Hinnad</router-link>
          <router-link :to="auth.isAuthenticated ? '/account' : '/account/login'">
            {{ auth.isAuthenticated ? 'Minu konto' : 'Logi sisse' }}
          </router-link>
        </nav>

        <router-link to="/planner" class="button button-primary">Alusta</router-link>
      </div>
    </header>

    <main>
      <router-view />
    </main>

    <footer class="site-footer">
      <div class="container footer-main">
        <div class="footer-brand">
          <router-link to="/" class="brand">
            <span class="brand-mark" aria-hidden="true">M</span>
            <span>Moodne peopakett</span>
          </router-link>
          <p>Hea pidu algab plaanist, mis sobib just sulle.</p>
        </div>
        <nav class="footer-links" aria-label="Jaluse lingid">
          <router-link to="/#themes">Peoteemad</router-link>
          <router-link to="/#how-it-works">Kuidas toimib</router-link>
          <router-link to="/#pricing">Paketid ja hinnad</router-link>
          <router-link to="/planner">Alusta planeerimist</router-link>
        </nav>
        <div class="footer-assurances">
          <p><span aria-hidden="true">✓</span> Alustamine on tasuta</p>
          <p><span aria-hidden="true">✓</span> Hinnad ja saadavus kinnitatakse enne tellimust</p>
          <p><span aria-hidden="true">✓</span> Sina valid, millist abi vajad</p>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>© {{ new Date().getFullYear() }} Moodne peopakett</span>
        <span>Planeeri rõõmuga.</span>
      </div>
    </footer>
  </div>
</template>
