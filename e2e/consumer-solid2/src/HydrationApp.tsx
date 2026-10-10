import { createSignal } from 'solid-js';
import { RobotHead } from 'robot-heads-solid/solid2';

export default function HydrationApp() {
  const [clicks, setClicks] = createSignal(0);
  const [state, setState] = createSignal<'idle' | 'thinking'>('idle');
  const [originalRefMatches, setOriginalRefMatches] = createSignal(false);
  const [refCallbacks, setRefCallbacks] = createSignal(0);
  let originalRef: HTMLCanvasElement | undefined;

  return <>
    <RobotHead
      paused
      state={state()}
      data-hydration-head="head"
      ref={[
        (element) => {
          originalRef = element;
          setOriginalRefMatches(originalRef === document.querySelector('[data-hydration-head="head"]'));
        },
        [
          () => setRefCallbacks((count) => count + 1),
          () => setRefCallbacks((count) => count + 1),
        ],
      ]}
      onClick={(event) => {
        if (event.currentTarget.dataset.hydrationHead === 'head') {
          setClicks((count) => count + 1);
          setState('thinking');
        }
      }}
    />
    <output id="hydration-clicks">{clicks()}</output>
    <output id="hydration-state">{state()}</output>
    <button id="hydration-state" onClick={() => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-hydration-head="head"]');
      canvas?.click();
    }}>Click hydrated canvas</button>
    <output id="hydration-ref-original">{String(originalRefMatches())}</output>
    <output id="hydration-ref-callbacks">{refCallbacks()}</output>
  </>;
}
