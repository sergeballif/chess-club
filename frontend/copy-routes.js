import { mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';

const routes = ['teacher']; // Add more routes as needed

for (const route of routes) {
  const dir = join('dist', route);
  mkdirSync(dir, { recursive: true });
  // Copy index.html for SPA fallback
  copyFileSync(join('dist', 'index.html'), join(dir, 'index.html'));
  // Copy 404.html for direct navigation fallback
  copyFileSync(join('dist', '404.html'), join(dir, '404.html'));
}
