import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import { vReveal } from './directives/reveal';
import router from './router';
import { loadRemoteContent } from './utils/content';

import './assets/css/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.directive('reveal', vReveal);

/*
 * Textes PocketBase appliqués AVANT le premier rendu (pas de « flash » des
 * textes embarqués). Délai court : au-delà, le site s'affiche avec les textes
 * du build. Sans `VITE_POCKETBASE_URL`, la promesse est résolue immédiatement.
 */
void loadRemoteContent(1500).finally(() => {
  app.mount('#app');
});
