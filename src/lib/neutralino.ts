import * as Neutralino from '@neutralinojs/lib';

const BACKEND_ORIGIN = 'http://127.0.0.1:8000';
const BACKEND_HEALTH_URL = `${BACKEND_ORIGIN}/api/media?offset=0&limit=1`;
const BACKEND_SHUTDOWN_URL = `${BACKEND_ORIGIN}/api/shutdown`;

export interface NeutralinoRuntimeWindow {
  NL_EXTENSION?: string;
  NL_MODE?: string;
  NL_PATH?: string;
  NL_PORT?: number | string;
  NL_TOKEN?: string;
}

export interface BackendLaunchResult {
  backendPath?: string;
  error?: unknown;
  method?: 'execCommand' | 'spawnProcess';
  status: 'launched' | 'failed' | 'skipped';
}

export interface BackendReadyOptions {
  attempts?: number;
  delayMs?: number;
  delay?: (ms: number) => Promise<void>;
  fetchImpl?: typeof fetch;
  onAttempt?: (attempt: number) => void;
}

let neutralinoInitialized = false;
let backendShutdownRegistered = false;

function getRuntimeWindow(): NeutralinoRuntimeWindow | undefined {
  return typeof window === 'undefined' ? undefined : window;
}

export function hasNeutralinoGlobals(runtimeWindow: NeutralinoRuntimeWindow | undefined = getRuntimeWindow()): boolean {
  return Boolean(
    runtimeWindow &&
    runtimeWindow.NL_MODE === 'window' &&
    runtimeWindow.NL_PATH &&
    runtimeWindow.NL_PORT !== undefined &&
    runtimeWindow.NL_TOKEN
  );
}

export function getBundledBackendPath(runtimeWindow: NeutralinoRuntimeWindow | undefined = getRuntimeWindow()): string | null {
  if (!runtimeWindow?.NL_PATH) return null;
  return `${runtimeWindow.NL_PATH}/backend${runtimeWindow.NL_EXTENSION ?? ''}`;
}

export function quoteCommandPath(path: string): string {
  return `"${path.replaceAll('"', '\\"')}"`;
}

export function ensureNeutralinoClient(runtimeWindow: NeutralinoRuntimeWindow | undefined = getRuntimeWindow()): boolean {
  if (!hasNeutralinoGlobals(runtimeWindow)) return false;

  if (!neutralinoInitialized) {
    Neutralino.init({ exportCustomMethods: false });
    neutralinoInitialized = true;
  }

  return true;
}

export async function startBundledBackend(
  runtimeWindow: NeutralinoRuntimeWindow | undefined = getRuntimeWindow()
): Promise<BackendLaunchResult> {
  if (!ensureNeutralinoClient(runtimeWindow)) {
    return { status: 'skipped' };
  }

  const backendPath = getBundledBackendPath(runtimeWindow);
  if (!backendPath) {
    return { status: 'failed', error: new Error('Missing Neutralino application path') };
  }

  try {
    await Neutralino.os.execCommand(quoteCommandPath(backendPath), { background: true });
    return { status: 'launched', method: 'execCommand', backendPath };
  } catch (execError) {
    try {
      await Neutralino.os.spawnProcess(backendPath);
      return { status: 'launched', method: 'spawnProcess', backendPath };
    } catch (spawnError) {
      return {
        status: 'failed',
        backendPath,
        error: { execError, spawnError }
      };
    }
  }
}

export function registerBackendShutdown(fetchImpl: typeof fetch = fetch): void {
  if (backendShutdownRegistered || !ensureNeutralinoClient()) return;

  backendShutdownRegistered = true;
  void Neutralino.events.on('windowClose', async () => {
    try {
      await fetchImpl(BACKEND_SHUTDOWN_URL, { method: 'POST' });
    } catch {
      // The backend may already be gone during app shutdown.
    }

    await Neutralino.app.exit();
  });
}

export async function showNeutralinoFolderDialog(title: string): Promise<string | null> {
  if (!ensureNeutralinoClient()) return null;

  const result = await Neutralino.os.showFolderDialog(title);
  return result ?? null;
}

export async function waitForBackendReady({
  attempts = 40,
  delayMs = 500,
  delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  fetchImpl = fetch,
  onAttempt
}: BackendReadyOptions = {}): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchImpl(BACKEND_HEALTH_URL);
      if (response.ok) return true;
    } catch {
      // Backend is not ready yet.
    }

    onAttempt?.(attempt + 1);
    await delay(delayMs);
  }

  return false;
}

export function resetNeutralinoClientForTests(): void {
  neutralinoInitialized = false;
  backendShutdownRegistered = false;
}
