import { createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import type { JSX } from 'solid-js';
import { RobotHead, robotHeadShapes, robotHeadStates } from 'robot-heads-solid';
import type { RobotHeadShape, RobotHeadState } from 'robot-heads-solid';

const shapeLabels: Record<RobotHeadShape, string> = {
  rectangle: 'Rectangle', square: 'Square', circle: 'Circle', hexagon: 'Hexagon',
};

const stateHints: Record<RobotHeadState, string> = {
  idle: 'Looks around, blinks, hops now and then.',
  thinking: 'Eyes up, dots pulsing, head tilted to one side.',
  searching: 'Sweeps side to side, a beam scanning the screen.',
  listening: 'Head cocked, an equaliser following the voice.',
  speaking: 'A mouth that moves with the words.',
  working: 'Head down, a progress bar filling.',
  happy: 'Bouncing, all smiles.',
  error: 'Shakes its head. Red X eyes.',
  sleeping: 'Drooped and dim, dreaming in z’s.',
};

interface Colors {
  color: string;
  trimColor: string;
  screenColor: string;
}

const DEFAULTS: Colors = {
  color: '#2b49a3', trimColor: '#93a6c8', screenColor: '#e8f2ff',
};

const SWATCHES: Record<keyof Colors, Array<[string, string]>> = {
  color: [
    ['Cobalt', '#2b49a3'], ['Tomato', '#c8372d'], ['Tangerine', '#e2762a'],
    ['Mustard', '#e0ad1f'], ['Mint', '#2f8f58'], ['Teal', '#1f8189'],
    ['Grape', '#6a45b8'], ['Bubblegum', '#d9558f'],
    ['Graphite', '#3a3d44'], ['Porcelain', '#e6e6ea'],
  ],
  trimColor: [
    ['Steel', '#93a6c8'], ['Silver', '#c4c9d2'],
    ['Brass', '#c9a45c'], ['Copper', '#c27a52'], ['Black', '#2a2c31'],
  ],
  screenColor: [
    ['White', '#e8f2ff'], ['Ice', '#7fe7ff'], ['Matrix', '#7dff9a'],
    ['Amber', '#ffc46b'], ['Neon', '#ff8fd0'],
  ],
};

const ROW_LABELS: Record<keyof Colors, string> = {
  color: 'Shell', trimColor: 'Trim', screenColor: 'Screen',
};

const COLOR_KEYS: Array<keyof Colors> = ['color', 'trimColor', 'screenColor'];

const SPEEDS = [0.5, 1, 1.5, 2];

const title = (value: string) => value[0].toUpperCase() + value.slice(1);

function useStageSize() {
  const measure = () => {
    const w = window.innerWidth, h = window.innerHeight;

    if (w < 900) return Math.max(240, Math.min(w - 32, 400));
    const room = Math.min(w - 2 * (300 + 40 + 40), h - 300);

    return Math.round(Math.max(260, Math.min(room, 520)));
  };

  const [size, setSize] = createSignal(measure());
  onMount(() => {
    const update = () => setSize(measure());
    window.addEventListener('resize', update);
    onCleanup(() => window.removeEventListener('resize', update));
  });

  return size;
}

function Dock(props: {
  shape: RobotHeadShape;
  onChange: (shape: RobotHeadShape) => void;
  colors: Colors;
  paused: boolean;
}) {
  return (
    <nav class="dock" aria-label="Shape">
      {robotHeadShapes.map((shape) => (
        <button class="dock-item" aria-pressed={shape === props.shape}
          aria-label={shapeLabels[shape]} onClick={() => props.onChange(shape)}>
          <span class="dock-icon">
            <RobotHead shape={shape} size={128} interactive={false}
              floorShadow={false} paused={props.paused} aria-hidden={true} {...props.colors} />
          </span>
          <span class="dock-tip">{shapeLabels[shape]}</span>
        </button>
      ))}
    </nav>
  );
}

function Swatches(props: {
  name: keyof Colors;
  value: string;
  onChange: (value: string) => void;
}) {
  const known = () => SWATCHES[props.name].find(([, hex]) => hex === props.value);

  return (
    <div class="control">
      <div class="control-head">
        <span class="control-label">{ROW_LABELS[props.name]}</span>
        <span class="control-value">{known()?.[0] ?? props.value}</span>
      </div>
      <div class="swatches">
        {SWATCHES[props.name].map(([label, hex]) => (
          <button class="swatch" style={{ background: hex }}
            title={label} aria-label={`${ROW_LABELS[props.name]}: ${label}`}
            aria-pressed={hex === props.value} onClick={() => props.onChange(hex)} />
        ))}
        <label class="swatch swatch-custom" title="Custom"
          aria-pressed={!known()} style={known() ? undefined : { background: props.value }}>
          <input type="color" value={props.value}
            aria-label={`${ROW_LABELS[props.name]}: custom colour`}
            onInput={(e) => props.onChange(e.currentTarget.value)} />
        </label>
      </div>
    </div>
  );
}

type Theme = 'light' | 'dark';

function useTheme() {
  const [theme, setTheme] = createSignal<Theme>(
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  );

  createEffect(() => { document.documentElement.dataset.theme = theme(); });

  const toggle = () => {
    const next = theme() === 'light' ? 'dark' : 'light';
    setTheme(next);

    try { localStorage.setItem('robot-heads-solid-theme', next); } catch { /* storage disabled */ }
  };

  return [theme, toggle] as const;
}

function ThemeToggle(props: { theme: Theme; onToggle: () => void }) {
  return (
    <button class="theme" onClick={props.onToggle}
      aria-label={props.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={props.theme === 'light' ? 'Dark mode' : 'Light mode'}>
      {props.theme === 'light' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden={true}>
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.8" stroke-linecap="round" aria-hidden={true}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </svg>
      )}
    </button>
  );
}

interface PropLine {
  key: string;
  name: string;
  value: string | number | boolean;
  on: boolean;
}

function isTextValue(value: PropLine['value']): value is string {
  return typeof value === 'string';
}

const propText = (line: PropLine) =>
  isTextValue(line.value)
    ? `${line.name}="${line.value}"`
    : `${line.name}={${line.value}}`;

function PropTokens(props: { line: PropLine }) {
  return (
    <>
      <span class="tok-attr">{props.line.name}</span>
      <span class="tok-punct">=</span>
      {isTextValue(props.line.value) ? (
        <span class="tok-string">"{props.line.value}"</span>
      ) : (
        <>
          <span class="tok-punct">{'{'}</span>
          <span class="tok-number">{String(props.line.value)}</span>
          <span class="tok-punct">{'}'}</span>
        </>
      )}
    </>
  );
}

function Snippet(props: { lines: PropLine[] }) {
  const previous = new Map<string, PropLine>();

  const displayed = (line: PropLine) => {
    if (line.on) previous.set(line.key, line);

    return previous.get(line.key) ?? line;
  };

  return (
    <pre class="code"><code>
      <span class="code-line"><span class="tok-punct">{'<'}</span><span class="tok-tag">RobotHead</span></span>
      {props.lines.map((line) => (
        <span class="code-prop" data-open={line.on}>
          <span class="code-prop-inner">
            {'  '}<PropTokens line={displayed(line)} />
          </span>
        </span>
      ))}
      <span class="code-line tok-punct">{'/>'}</span>
    </code></pre>
  );
}

function useCopy() {
  const [copied, setCopied] = createSignal<string | null>(null);
  let timeout: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(timeout));

  const copy = (key: string, value: string) => {
    void navigator.clipboard?.writeText(value).then(() => {
      setCopied(key);
      clearTimeout(timeout);
      timeout = setTimeout(() => setCopied(null), 1400);
    }).catch(() => {});
  };

  return [copied, copy] as const;
}

export default function App(): JSX.Element {
  const query = () => new URLSearchParams(location.search);

  const [state, setState] = createSignal<RobotHeadState>(
    robotHeadStates.find((value) => value === query().get('state')) ?? 'idle',
  );

  const [shape, setShapeState] = createSignal<RobotHeadShape>(
    robotHeadShapes.find((value) => value === query().get('shape')) ?? 'rectangle',
  );

  const [colors, setColors] = createSignal<Colors>(DEFAULTS);
  const [speed, setSpeed] = createSignal(1);
  const [paused, setPaused] = createSignal(query().has('paused') && query().get('paused') !== 'false');
  const [copied, copy] = useCopy();
  const [theme, toggleTheme] = useTheme();
  const size = useStageSize();

  const updateURL = (key: string, value: string | null) => {
    const url = new URL(location.href);

    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);

    history.pushState(null, '', url);
  };

  const setShape = (next: RobotHeadShape) => {
    setShapeState(next);
    updateURL('shape', next);
  };

  const setSelectedState = (next: RobotHeadState) => {
    setState(next);
    updateURL('state', next);
  };

  const setPlayback = (next: boolean) => {
    setPaused(next);
    updateURL('paused', next ? '' : null);
  };

  onMount(() => {
    const restore = () => {
      const params = query();
      setState(robotHeadStates.find((value) => value === params.get('state')) ?? 'idle');
      setShapeState(robotHeadShapes.find((value) => value === params.get('shape')) ?? 'rectangle');
      setPaused(params.has('paused') && params.get('paused') !== 'false');
    };

    window.addEventListener('popstate', restore);
    onCleanup(() => window.removeEventListener('popstate', restore));
  });

  const changed = createMemo(() =>
    colors().color !== DEFAULTS.color ||
    colors().trimColor !== DEFAULTS.trimColor ||
    colors().screenColor !== DEFAULTS.screenColor ||
    speed() !== 1 || paused(),
  );

  const lines = createMemo<PropLine[]>(() => [
    { key: 'shape', name: 'shape', value: shape(), on: true },
    { key: 'state', name: 'state', value: state(), on: true },
    { key: 'color', name: 'color', value: colors().color, on: colors().color !== DEFAULTS.color },
    { key: 'trimColor', name: 'trimColor', value: colors().trimColor, on: colors().trimColor !== DEFAULTS.trimColor },
    { key: 'screenColor', name: 'screenColor', value: colors().screenColor, on: colors().screenColor !== DEFAULTS.screenColor },
    { key: 'speed', name: 'speed', value: speed(), on: speed() !== 1 },
    { key: 'paused', name: 'paused', value: true, on: paused() },
  ]);

  const snippet = createMemo(() =>
    `<RobotHead\n${lines().filter((line) => line.on).map((line) => `  ${propText(line)}\n`).join('')}/>`,
  );

  return (
    <div class="app">
      <Dock shape={shape()} onChange={setShape} colors={colors()} paused={paused()} />

      <header class="masthead">
        <div class="byline">
          <span class="name">robot-heads-solid</span>
          <span class="by">ported from</span>
          <a class="author" href="https://github.com/fayazara/robot-heads"
            target="_blank" rel="noopener noreferrer">
            <img src="https://github.com/fayazara.png?size=64" alt="" width={24} height={24} />
            Fayaz Ahmed
          </a>
        </div>
        <div class="masthead-end">
          <button class="install" onClick={() => copy('install', 'bun add robot-heads-solid')}>
            bun add robot-heads-solid
            <span class="install-copy">{copied() === 'install' ? 'Copied' : 'Copy'}</span>
          </button>
          <a class="icon-link" href="https://github.com/jhomra21/robot-heads-solid"
            target="_blank" rel="noopener noreferrer" aria-label="robot-heads-solid on GitHub" title="GitHub">
            <svg viewBox="0 0 24 24" aria-hidden={true}>
              <path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2" />
            </svg>
          </a>
          <ThemeToggle theme={theme()} onToggle={toggleTheme} />
        </div>
      </header>

      <main class="stage" aria-label="Preview">
        <RobotHead shape={shape()} state={state()} size={size()}
          paused={paused()} speed={speed()} {...colors()} />
        <div class="caption">
          <h1 class="font-bold">{title(state())}</h1>
          <p>{stateHints[state()]}</p>
        </div>
      </main>

      <aside class="controls" aria-label="Controls">
        {COLOR_KEYS.map((key) => (
          <Swatches name={key} value={colors()[key]}
            onChange={(value) => setColors((current) => ({ ...current, [key]: value }))} />
        ))}
        <div class="control">
          <div class="control-head">
            <span class="control-label">Speed</span>
            <button class="text-button" onClick={() => setPlayback(!paused())}>
              {paused() ? 'Play' : 'Pause'}
            </button>
          </div>
          <div class="segments" role="group" aria-label="Speed">
            {SPEEDS.map((value) => (
              <button class="segment" aria-pressed={value === speed()}
                onClick={() => setSpeed(value)}>{value}×</button>
            ))}
          </div>
        </div>
        <div class="control">
          <div class="control-head">
            <span class="control-label">Usage</span>
            <span class="control-actions">
              <button class="text-button reset" aria-hidden={!changed()}
                tabIndex={changed() ? 0 : -1}
                onClick={() => { setColors(DEFAULTS); setSpeed(1); setPlayback(false); }}>Reset</button>
              <button class="text-button" onClick={() => copy('snippet', snippet())}>
                {copied() === 'snippet' ? 'Copied' : 'Copy'}
              </button>
            </span>
          </div>
          <Snippet lines={lines()} />
        </div>
      </aside>

      <nav class="states" aria-label="State">
        {robotHeadStates.map((value) => (
          <button class="state" aria-pressed={value === state()} onClick={() => setSelectedState(value)}>
            <span class="state-head">
              <RobotHead shape={shape()} state={value} size={120} paused={paused()}
                speed={speed()} interactive={false} aria-hidden={true} {...colors()} />
            </span>
            <span class="state-name">{title(value)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
