import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@neutralinojs/lib', () => ({
  app: {
    exit: vi.fn()
  },
  events: {
    on: vi.fn()
  },
  init: vi.fn(),
  os: {
    execCommand: vi.fn(),
    showFolderDialog: vi.fn(),
    spawnProcess: vi.fn()
  }
}));

import * as Neutralino from '@neutralinojs/lib';
import {
  getBundledBackendPath,
  hasNeutralinoGlobals,
  quoteCommandPath,
  resetNeutralinoClientForTests,
  showNeutralinoFolderDialog,
  startBundledBackend,
  waitForBackendReady,
  type NeutralinoRuntimeWindow
} from '../src/lib/neutralino';

const neutralinoWindow: NeutralinoRuntimeWindow = {
  NL_EXTENSION: '.exe',
  NL_MODE: 'window',
  NL_PATH: 'C:/Users/Test User/MrGallery-Windows',
  NL_PORT: 55111,
  NL_TOKEN: 'access.connect'
};

describe('Neutralino runtime helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetNeutralinoClientForTests();
    Reflect.deleteProperty(globalThis, 'window');
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('detects only packaged Neutralino window runtime globals', () => {
    expect(hasNeutralinoGlobals(undefined)).toBe(false);
    expect(hasNeutralinoGlobals({ NL_MODE: 'window' })).toBe(false);
    expect(hasNeutralinoGlobals(neutralinoWindow)).toBe(true);
  });

  it('resolves and quotes the bundled backend executable path', () => {
    expect(getBundledBackendPath(neutralinoWindow)).toBe('C:/Users/Test User/MrGallery-Windows/backend.exe');
    expect(quoteCommandPath('C:/Users/Test User/MrGallery-Windows/backend.exe')).toBe(
      '"C:/Users/Test User/MrGallery-Windows/backend.exe"'
    );
  });

  it('starts the bundled backend with background execCommand in Neutralino mode', async () => {
    vi.mocked(Neutralino.os.execCommand).mockResolvedValue({
      exitCode: 0,
      pid: 1234,
      stdErr: '',
      stdOut: ''
    });

    const result = await startBundledBackend(neutralinoWindow);

    expect(result).toEqual({
      backendPath: 'C:/Users/Test User/MrGallery-Windows/backend.exe',
      method: 'execCommand',
      status: 'launched'
    });
    expect(Neutralino.init).toHaveBeenCalledWith({ exportCustomMethods: false });
    expect(Neutralino.os.execCommand).toHaveBeenCalledWith(
      '"C:/Users/Test User/MrGallery-Windows/backend.exe"',
      { background: true }
    );
    expect(Neutralino.os.spawnProcess).not.toHaveBeenCalled();
  });

  it('falls back to spawnProcess when background execCommand fails', async () => {
    vi.mocked(Neutralino.os.execCommand).mockRejectedValue(new Error('exec failed'));
    vi.mocked(Neutralino.os.spawnProcess).mockResolvedValue({ id: 1, pid: 1234 });

    const result = await startBundledBackend(neutralinoWindow);

    expect(result.status).toBe('launched');
    expect(result.method).toBe('spawnProcess');
    expect(Neutralino.os.spawnProcess).toHaveBeenCalledWith(
      'C:/Users/Test User/MrGallery-Windows/backend.exe'
    );
  });

  it('skips backend launch outside Neutralino runtime', async () => {
    const result = await startBundledBackend(undefined);

    expect(result).toEqual({ status: 'skipped' });
    expect(Neutralino.init).not.toHaveBeenCalled();
    expect(Neutralino.os.execCommand).not.toHaveBeenCalled();
  });

  it('uses Neutralino folder dialog when runtime globals are available', async () => {
    Object.assign(globalThis, { window: neutralinoWindow });
    vi.mocked(Neutralino.os.showFolderDialog).mockResolvedValue('D:/Photos');

    await expect(showNeutralinoFolderDialog('Select a folder')).resolves.toBe('D:/Photos');
    expect(Neutralino.os.showFolderDialog).toHaveBeenCalledWith('Select a folder');
  });
});

describe('backend readiness polling', () => {
  it('retries until the backend responds', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('connection refused'))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));

    const ready = await waitForBackendReady({
      delay: async () => undefined,
      fetchImpl
    });

    expect(ready).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('returns false after all attempts fail', async () => {
    const onAttempt = vi.fn();
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('connection refused'));

    const ready = await waitForBackendReady({
      attempts: 3,
      delay: async () => undefined,
      fetchImpl,
      onAttempt
    });

    expect(ready).toBe(false);
    expect(onAttempt).toHaveBeenCalledTimes(3);
  });
});
