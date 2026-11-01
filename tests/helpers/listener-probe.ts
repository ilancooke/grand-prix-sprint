import type { Page } from '@playwright/test';

/** Observe gameplay listener lifetime without adding a production inspection API. */
export async function installListenerProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const registrations: { target: EventTarget; type: string; listener: EventListenerOrEventListenerObject; capture: boolean }[] = [];
    const watched = new Set(['keydown', 'keyup', 'blur', 'visibilitychange']);
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      const capture = typeof options === 'boolean' ? options : options?.capture ?? false;
      // Vite and Playwright can lazily install their own blur/key listeners.
      // Attribute registrations to the actual application module/bundle.
      const application = /\/src\/platform\/input\.ts|\/assets\/index-/.test(new Error().stack ?? '');
      if (application && listener && (this === window || this === document) && watched.has(type) &&
          !registrations.some((item) => item.target === this && item.type === type && item.listener === listener && item.capture === capture)) {
        registrations.push({ target: this, type, listener, capture });
      }
      return add.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function(type, listener, options) {
      const capture = typeof options === 'boolean' ? options : options?.capture ?? false;
      const index = registrations.findIndex((item) => item.target === this && item.type === type && item.listener === listener && item.capture === capture);
      if (index >= 0) registrations.splice(index, 1);
      return remove.call(this, type, listener, options);
    };
    Object.defineProperty(window, '__gameplayListenerCount', { get: () => registrations.length });
  });
}

export async function gameplayListenerCount(page: Page): Promise<number> {
  return page.evaluate(() => Reflect.get(window, '__gameplayListenerCount') as number);
}
