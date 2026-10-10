import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

declare global {
  interface Window {
    __solid2Lifecycle: {
      raf: Set<number>;
      observers: number;
      mediaListeners: number;
      listeners: Record<string, number>;
    };
  }
}

test('published Solid 2 entrypoint mounts and reacts across all states', async ({ page }) => {
  const errors: string[] = [];
  await page.addInitScript(() => {
    const listeners: Record<string, number> = {};

    const lifecycle = {
      raf: new Set<number>(),
      observers: 0,
      mediaListeners: 0,
      listeners,
    };

    Object.defineProperty(window, '__solid2Lifecycle', { value: lifecycle });

    const originalRaf = window.requestAnimationFrame.bind(window);
    const originalCancel = window.cancelAnimationFrame.bind(window);

    window.requestAnimationFrame = (callback) => {
      let id = 0;
      id = originalRaf((time) => {
        lifecycle.raf.delete(id);
        callback(time);
      });
      lifecycle.raf.add(id);

      return id;
    };

    window.cancelAnimationFrame = (id) => {
      lifecycle.raf.delete(id);
      originalCancel(id);
    };

    const OriginalObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends OriginalObserver {
      private connected = false;

      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super(callback, options);
      }

      override disconnect() {
        if (!this.connected) return;
        this.connected = false;
        lifecycle.observers--;
        super.disconnect();
      }

      override observe(target: Element) {
        if (!this.connected) {
          this.connected = true;
          lifecycle.observers++;
        }

        super.observe(target);
      }
    };

    const originalMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      const media = originalMatchMedia(query);
      const add = media.addEventListener.bind(media);
      const remove = media.removeEventListener.bind(media);
      const listeners = new Set<EventListenerOrEventListenerObject>();
      media.addEventListener = (type, listener, options) => {
        if (type === 'change' && listener && !listeners.has(listener)) {
          listeners.add(listener);
          lifecycle.mediaListeners++;
        }

        add(type, listener, options);
      };

      media.removeEventListener = (type, listener, options) => {
        if (type === 'change' && listener && listeners.delete(listener)) lifecycle.mediaListeners--;
        remove(type, listener, options);
      };

      return media;
    };

    const originalAdd = EventTarget.prototype.addEventListener;
    const originalRemove = EventTarget.prototype.removeEventListener;
    const activeListeners = new WeakMap<EventTarget, Map<string, Set<EventListenerOrEventListenerObject>>>();
    const key = (target: EventTarget, type: string) => `${target === document ? 'document' : target === window ? 'window' : 'other'}:${type}`;

    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (listener && (this === document || this === window)) {
        let byType = activeListeners.get(this);

        if (!byType) activeListeners.set(this, byType = new Map());
        let listeners = byType.get(type);

        if (!listeners) byType.set(type, listeners = new Set());

        if (!listeners.has(listener)) {
          listeners.add(listener);
          lifecycle.listeners[key(this, type)] = (lifecycle.listeners[key(this, type)] ?? 0) + 1;
        }
      }

      originalAdd.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function(type, listener, options) {
      if (listener && (this === document || this === window)) {
        const listeners = activeListeners.get(this)?.get(type);

        if (listeners?.delete(listener)) lifecycle.listeners[key(this, type)]--;
      }

      originalRemove.call(this, type, listener, options);
    };
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('[vite]') && !message.text().includes('WebSocket connection')) {
      errors.push(message.text());
    }
  });
  await page.goto('http://127.0.0.1:4176/');
  const canvas = page.locator('canvas[data-solid2="head"]');
  await expect(canvas).toHaveAttribute('aria-label', 'Robot, idle');
  await expect(page.locator('canvas[data-matrix]')).toHaveCount(36);

  const paintedVariantCount = await page.locator('canvas[data-matrix]').evaluateAll((canvases) =>
    canvases.filter((canvas) => {
      const context = canvas.getContext('2d');

      if (!context) return false;

      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;

      return false;
    }).length,
  );

  expect(paintedVariantCount).toBe(36);
  await expect(page.locator('#array-ref-connected')).toHaveText('true');
  await expect(page.locator('#native-array-ref-connected')).toHaveText('true');

  const stateScreens: string[] = [];

  for (const state of ['thinking', 'searching', 'listening', 'speaking', 'working', 'happy', 'error', 'sleeping', 'idle']) {
    await page.getByRole('button', { name: 'Next state' }).click();
    await expect(page.locator('#state')).toHaveText(state);
    await expect(canvas).toHaveAttribute('aria-label', `Robot, ${state}`);
    stateScreens.push((await canvas.screenshot()).toString('base64'));
  }

  expect(new Set(stateScreens).size).toBeGreaterThan(1);

  await canvas.click();
  await expect(page.locator('#clicks')).toHaveText('1');
  await page.locator('canvas[data-array-ref="head"]').click();
  await expect(page.locator('#array-clicks')).toHaveText('1');
  await page.mouse.move(500, 300);
  await page.getByRole('button', { name: 'Toggle pause' }).click();
  await page.mouse.move(500, 300);
  await page.waitForTimeout(120);
  const pointerLeft = await canvas.screenshot();
  await page.mouse.move(760, 520);
  await page.waitForTimeout(120);
  const pointerRight = await canvas.screenshot();
  expect(pointerLeft.equals(pointerRight)).toBe(false);

  const activeLifecycle = await page.evaluate(() => {
    const { raf, observers, mediaListeners, listeners } = window.__solid2Lifecycle;

    return { raf: raf.size, observers, mediaListeners, listeners };
  });

  expect(activeLifecycle.raf).toBeGreaterThan(0);
  expect(activeLifecycle.listeners['document:pointermove']).toBe(1);

  await page.getByRole('button', { name: 'Toggle mount' }).click();
  await expect(page.locator('canvas[data-solid2="head"]')).toHaveCount(0);

  const disposedLifecycle = await page.evaluate(() => {
    const { raf, observers, mediaListeners, listeners } = window.__solid2Lifecycle;

    return { raf: raf.size, observers, mediaListeners, listeners };
  });

  expect(disposedLifecycle.raf).toBe(0);
  expect(disposedLifecycle.observers).toBe(activeLifecycle.observers - 1);
  expect(disposedLifecycle.listeners['document:pointermove']).toBe(0);
  expect(disposedLifecycle.listeners['document:pointerleave']).toBe(0);
  expect(disposedLifecycle.listeners['window:blur']).toBe(0);
  expect(disposedLifecycle.listeners['document:visibilitychange']).toBe(0);
  expect(disposedLifecycle.mediaListeners).toBe(activeLifecycle.mediaListeners - 1);
  await page.getByRole('button', { name: 'Toggle mount' }).click();
  await page.getByRole('button', { name: 'Final state' }).click();
  const remounted = page.locator('canvas[data-solid2="head"]');
  await expect(remounted).toHaveAttribute('aria-label', 'Robot, idle');
  await expect(remounted).toHaveCSS('width', '160px');
  await expect(remounted).toHaveJSProperty('width', Math.round(160 * Math.min(2, await page.evaluate(() => devicePixelRatio || 1))));

  mkdirSync('test-results', { recursive: true });
  await remounted.screenshot({ path: 'test-results/consumer-solid2-after.png' });
  const manifest = JSON.parse(readFileSync('e2e/consumer-solid2/node_modules/robot-heads-solid/package.json', 'utf8'));
  writeFileSync('test-results/consumer-solid2-browser.json', JSON.stringify({
    solid: manifest.dependencies?.['solid-js'] ?? manifest.peerDependencies['solid-js'],
    testedStates: ['idle', 'thinking', 'searching', 'listening', 'speaking', 'working', 'happy', 'error', 'sleeping'],
    testedHeadVariants: 36,
    clickCount: 1,
    mountToggled: true,
    pointerMoved: true,
    activeRAFBeforeDispose: activeLifecycle.raf,
    disposedRAF: disposedLifecycle.raf,
    observerCountDropped: activeLifecycle.observers - disposedLifecycle.observers,
    mediaListenersDroppedOnDispose: activeLifecycle.mediaListeners - disposedLifecycle.mediaListeners,
    pointerListenersAfterDispose: disposedLifecycle.listeners['document:pointermove'],
    screenshotsDiffer: new Set(stateScreens).size > 1,
    errors,
  }, null, 2));
  expect(errors).toEqual([]);
});

test('published Solid 2 hydration replays an early click and preserves nested native refs', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('[vite]') && !message.text().includes('WebSocket connection')) {
      errors.push(message.text());
    }
  });
  const { html, script } = JSON.parse(readFileSync('test-results/consumer-solid2-hydration.json', 'utf8'));
  await page.route('**/hydration', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: `<!doctype html><html><head>${script}</head><body><div id="root">${html}</div><script>setTimeout(() => import('/src/hydrate-client.tsx'), 2000)</script></body></html>`,
  }));
  await page.goto('http://127.0.0.1:4176/hydration');
  const canvas = page.locator('[data-hydration-head="head"]');
  await page.waitForTimeout(50);
  await canvas.click();
  await page.waitForFunction(() => document.documentElement.dataset.solid2Hydrated === 'true');
  await expect(page.locator('#hydration-clicks')).toHaveText('1');
  await expect(page.locator('output#hydration-state')).toHaveText('thinking');
  await expect(canvas).toHaveAttribute('aria-label', 'Robot, thinking');
  await expect(page.locator('#hydration-ref-original')).toHaveText('true');
  await expect(page.locator('#hydration-ref-callbacks')).toHaveText('2');
  await expect(errors).toEqual([]);

  writeFileSync('test-results/consumer-solid2-hydration-browser.json', JSON.stringify({
    preHydrationClickReplayed: true,
    clickCount: 1,
    stateAfterReplay: 'thinking',
    originalRefPreserved: true,
    nestedArrayRefsCalled: 2,
    errors,
  }, null, 2));
});