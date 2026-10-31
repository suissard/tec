import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import { vReveal } from './directives/reveal';
import router from './router';

import './assets/css/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.directive('reveal', vReveal);

app.mount('#app');
