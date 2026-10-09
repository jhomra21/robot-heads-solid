import { createSignal } from 'solid-js';
import { RobotHead } from 'robot-heads-solid';

export function HydrationApp() {
  const [clicks, setClicks] = createSignal(0);

  return <>
    <RobotHead paused onClick={() => setClicks(count => count + 1)} data-hydration="canvas" />
    <output id="queued-clicks">{clicks()}</output>
  </>;
}
