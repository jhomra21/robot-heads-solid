import { generateHydrationScript, renderToString } from '@solidjs/web';
import { RobotHead } from 'robot-heads-solid/solid2';
import HydrationApp from './HydrationApp';

export function verifySSR() {
  const html = renderToString(() => <RobotHead paused state="thinking" aria-label="SSR robot" />);

  if (!html.includes('aria-label="SSR robot"') || !html.includes('<canvas')) {
    throw new Error(`Solid 2 server rendering did not render the head: ${html}`);
  }

  const hydrationHtml = renderToString(HydrationApp);

  return {
    html,
    hydrationHtml,
    hydrationScript: generateHydrationScript(),
    renderedCanvas: true,
    accessibleName: 'SSR robot',
  };
}
