import { mount } from './app';

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mount);
else mount();
