import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { RobotHead } from 'robot-heads-solid';

function App() {
  const [state, setState] = createSignal<'idle' | 'error'>('idle');
  const [shape, setShape] = createSignal<'circle' | 'hexagon'>('circle');
  const [color, setColor] = createSignal('#2b49a3');
  const [paused, setPaused] = createSignal(true);
  const [size, setSize] = createSignal(160);
  const [speed, setSpeed] = createSignal(1);
  const [canvas, setCanvas] = createSignal<HTMLCanvasElement>();

  return <>
    <RobotHead state={state()} shape={shape()} color={color()} paused={paused()} size={size()} speed={speed()}
      ref={setCanvas} data-consumer="true" aria-label={`consumer ${state()}`} />
    <button onClick={() => { setState('error'); setShape('hexagon'); setColor('#c8372d'); }}>Update</button>
    <button onClick={() => setPaused(!paused())}>Toggle pause</button>
    <button onClick={() => { setSize(Infinity); setSpeed(Infinity); setPaused(false); }}>Invalid dimensions and speed</button>
    <output id="ref">{canvas()?.tagName ?? 'missing'}</output>
  </>;
}

render(App, document.getElementById('root')!);
