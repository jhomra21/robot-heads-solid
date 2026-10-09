import { hydrate } from 'solid-js/web';
import { createComponent } from 'solid-js';
import { HydrationApp } from './Hydration';

await new Promise<void>(resolve => {
  Reflect.set(window, 'startHydration', resolve);
});

hydrate(() => createComponent(HydrationApp, {}), document.getElementById('root')!);
