import { hydrate } from '@solidjs/web';
import HydrationApp from './HydrationApp';

hydrate(HydrationApp, document.getElementById('root')!);

document.documentElement.dataset.solid2Hydrated = 'true';
