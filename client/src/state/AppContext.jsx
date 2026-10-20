import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Api } from '../api/client.js';
import { audio } from '../audio/audio.js';

const AuthCtx = createContext(null);
const SettingsCtx = createContext(null);

export const DEFAULT_SETTINGS = { musicVolume: 0.5, sfxVolume: 0.7, muted: false, reducedMotion: false, textScale: 1, touchControls: 'auto' };
const LOCAL_KEY = 'lfj_settings';

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ devTools: false });
  const [bootError, setBootError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [me, cfg] = await Promise.all([Api.me(), Api.config().catch(() => ({ devTools: false }))]);
      setUser(me.user);
      setConfig(cfg);
      setBootError(null);
    } catch (e) {
      setBootError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const auth = useMemo(
    () => ({
      user,
      loading,
      config,
      bootError,
      retry: refresh,
      login: async (b) => setUser((await Api.login(b)).user),
      register: async (b) => setUser((await Api.register(b)).user),
      guest: async () => setUser((await Api.guest()).user),
      upgrade: async (b) => setUser((await Api.upgrade(b)).user),
      logout: async () => {
        await Api.logout();
        setUser(null);
      },
    }),
    [user, loading, config, bootError, refresh],
  );

  // ── settings: server-backed for signed-in players, cached locally for instant start ──
  const [settings, setSettings] = useState(() => {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!user) return;
    Api.settings()
      .then((r) => setSettings((s) => ({ ...s, ...r.settings })))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    audio.setSettings(settings);
    document.documentElement.style.setProperty('--ui-scale', String(settings.textScale));
    document.documentElement.classList.toggle('reduced-motion', !!settings.reducedMotion);
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable */
    }
  }, [settings]);

  const updateSettings = useCallback(
    (patch) => {
      setSettings((s) => ({ ...s, ...patch }));
      if (!user) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => Api.saveSettings(patch).catch(() => {}), 400);
    },
    [user],
  );

  return (
    <AuthCtx.Provider value={auth}>
      <SettingsCtx.Provider value={{ settings, updateSettings }}>{children}</SettingsCtx.Provider>
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
export const useSettings = () => useContext(SettingsCtx);
