import { createSignal, onSettled } from 'solid-js';
import { render, Show } from '@solidjs/web';
import { RobotHead, robotHeadStates, robotHeadShapes } from 'robot-heads-solid/solid2';

function App() {
  const [state, setState] = createSignal<(typeof robotHeadStates)[number]>('idle');
  const [shape, setShape] = createSignal<(typeof robotHeadShapes)[number]>('rectangle');
  const [color, setColor] = createSignal('#2b49a3');
  const [paused, setPaused] = createSignal(true);
  const [speed, setSpeed] = createSignal(1);
  const [mounted, setMounted] = createSignal(true);
  const [clicks, setClicks] = createSignal(0);
  const [arrayRef, setArrayRef] = createSignal<HTMLCanvasElement>();
  const [nativeArrayRef, setNativeArrayRef] = createSignal<HTMLCanvasElement>();
  const [arrayClicks, setArrayClicks] = createSignal(0);
  const [arrayRefConnected, setArrayRefConnected] = createSignal(false);
  const [nativeArrayRefConnected, setNativeArrayRefConnected] = createSignal(false);

  onSettled(() => {
    setArrayRefConnected(arrayRef()?.isConnected === true);
    setNativeArrayRefConnected(nativeArrayRef()?.isConnected === true);
  });

  return <>
    <Show when={mounted()}>
      <RobotHead state={state()} shape={shape()} color={color()} paused={paused()} speed={speed()}
        data-solid2="head" onClick={() => setClicks((count) => count + 1)} />
    </Show>
    <output id="state">{state()}</output>
    <output id="clicks">{clicks()}</output>
    <output id="array-clicks">{arrayClicks()}</output>
    <RobotHead
      paused
      data-array-ref="head"
      ref={[
        (element) => setArrayRef(element),
        (element) => setArrayRef((current) => current === element ? current : element),
      ]}
      onClick={[(_data, event) => {
        if (event.currentTarget.dataset.arrayRef === 'head') setArrayClicks((count) => count + 1);
      }, undefined]}
    />
    <canvas data-native-array-ref="canvas" ref={[
      (element) => setNativeArrayRef(element),
      (element) => setNativeArrayRef((current) => current === element ? current : element),
    ]} />
    <output id="array-ref-connected">{String(arrayRefConnected())}</output>
    <output id="native-array-ref-connected">{String(nativeArrayRefConnected())}</output>
    <button onClick={() => {
      const next = (robotHeadStates.indexOf(state()) + 1) % robotHeadStates.length;
      setState(robotHeadStates[next]!);
      setShape(robotHeadShapes[next % robotHeadShapes.length]!);
      setColor(next % 2 ? '#c8372d' : '#2b49a3');
    }}>Next state</button>
    <button onClick={() => setPaused(!paused())}>Toggle pause</button>
    <button onClick={() => setSpeed(speed() === 0 ? 1 : 0)}>Toggle speed</button>
    <button onClick={() => setMounted(!mounted())}>Toggle mount</button>
    <button onClick={() => { setState('idle'); setShape('circle'); setColor('#c8372d'); }}>Final state</button>
    <section id="matrix">
      {robotHeadStates.flatMap((matrixState) => robotHeadShapes.map((matrixOutline) =>
        <RobotHead
          state={matrixState}
          shape={matrixOutline}
          paused
          interactive={false}
          data-matrix={`${matrixState}-${matrixOutline}`}
        />
      ))}
    </section>
  </>;
}

render(App, document.getElementById('root')!);
