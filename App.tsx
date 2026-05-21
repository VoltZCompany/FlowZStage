import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Font from 'expo-font';
import { Platform, Alert, View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { TasksProvider } from './src/context/TasksContext';
import AppNavigator from './src/navigation/AppNavigator';
import { requestPermissions, setupNotificationChannels } from './src/services/notificationService';
import ErrorBoundary from './src/components/ErrorBoundary';
import { Icon } from './src/components/icons';

function UpdateBanner({ onUpdate }: { onUpdate: () => void }) {
  const { isDark } = useTheme();
  const bg = isDark ? 'rgba(18,18,24,0.96)' : 'rgba(255,255,255,0.96)';
  const textColor = isDark ? '#F2F2F7' : '#0A0F1A';
  const subColor = isDark ? 'rgba(242,242,247,0.45)' : 'rgba(10,15,26,0.45)';
  return (
    <TouchableOpacity
      onPress={onUpdate}
      activeOpacity={0.88}
      style={[
        {
          position: 'absolute', bottom: 106, left: 16, right: 16, zIndex: 9999,
          backgroundColor: bg,
          borderRadius: 20,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 16, paddingVertical: 13,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 32,
        },
        Platform.OS === 'web' && ({
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        } as any),
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 38, height: 38, borderRadius: 12,
          backgroundColor: '#0A84FF1A',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="refresh" color="#0A84FF" size={20} />
        </View>
        <View>
          <Text style={{ color: textColor, fontWeight: '700', fontSize: 14, letterSpacing: -0.3 }}>
            Versão atualizada
          </Text>
          <Text style={{ color: subColor, fontSize: 12, marginTop: 1 }}>
            Recarregue para aplicar
          </Text>
        </View>
      </View>
      <View style={{
        backgroundColor: '#0A84FF',
        borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 8,
      }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: -0.2 }}>
          Recarregar
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function AppInner() {
  const { isDark } = useTheme();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  Font.useFonts({
    'ClashDisplay-Bold':      require('./assets/fonts/ClashDisplay-Bold.ttf'),
    'ClashDisplay-Semibold':  require('./assets/fonts/ClashDisplay-Semibold.ttf'),
    'CabinetGrotesk-Regular': require('./assets/fonts/CabinetGrotesk-Regular.ttf'),
    'CabinetGrotesk-Medium':  require('./assets/fonts/CabinetGrotesk-Medium.ttf'),
    'CabinetGrotesk-Bold':    require('./assets/fonts/CabinetGrotesk-Bold.ttf'),
    'SpaceGrotesk-Bold':      require('./assets/fonts/SpaceGrotesk-Bold.ttf'),
    'SpaceGrotesk-SemiBold':  require('./assets/fonts/SpaceGrotesk-SemiBold.ttf'),
  });

  useEffect(() => {
    async function init() {
      await setupNotificationChannels();
      const granted = await requestPermissions();
      if (!granted && Platform.OS !== 'web') {
        Alert.alert('🔔 Ative as notificações', 'Para receber lembretes das suas tarefas, ative as notificações nas configurações do seu dispositivo.', [{ text: 'OK' }]);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Viewport: prevent zoom on input focus (iOS Safari zooms when font-size < 16px),
    // disable manual pinch-zoom, and ensure safe-area coverage.
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
    }

    // Body background (avoid white flash behind status bar)
    document.documentElement.style.backgroundColor = '#1C1C1E';
    document.body.style.backgroundColor = '#1C1C1E';

    // Sistema de fontes iOS — SF Pro no Safari/iOS, Helvetica Neue como fallback.
    const fontStyle = document.createElement('style');
    fontStyle.id = 'system-font-override';
    fontStyle.textContent = `
      :root { --app-font: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif; }
      html, body, #root, #root * , input, textarea, select, button {
        font-family: var(--app-font) !important;
      }
      /* --app-height é setado via JS para window.innerHeight, que reflete a
         altura real visível excluindo a chrome do browser (barra de endereço,
         barra de navegação inferior). É o fix mais confiável cross-browser para
         o problema de "bottom missing" no iOS Safari e Android Chrome. */
      html, body, #root {
        height: var(--app-height, 100dvh);
        max-height: var(--app-height, 100dvh);
        overflow: hidden;
        overflow-x: hidden;
        max-width: 100vw;
        position: fixed;
        width: 100%;
      }
      body { display: flex; flex-direction: column; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }
      #root { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
      #root > div { flex: 1; overflow: hidden; }
      /* iOS Safari zooms when focused input font-size < 16px. */
      input, textarea { font-size: max(16px, 1em) !important; touch-action: manipulation; }
      button, a, [role="button"] { touch-action: manipulation; }
    `;
    document.head.appendChild(fontStyle);

    // --app-height: fixa a altura real visível como variável CSS. Sem isso,
    // 100vh no iOS Safari inclui a barra de endereço e o conteúdo do fundo
    // fica cortado. Atualiza no resize para cobrir rotação de tela também.
    const setAppHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', () => setTimeout(setAppHeight, 100));

    // Manifest
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest.json';
    document.head.appendChild(link);

    // Apple PWA
    const tags: [string, string][] = [
      ['apple-mobile-web-app-capable', 'yes'],
      ['apple-mobile-web-app-status-bar-style', 'black-translucent'],
      ['apple-mobile-web-app-title', 'Tesla'],
    ];
    tags.forEach(([name, content]) => {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    });

    // Service worker — recarrega automaticamente quando um novo SW assume o controle
    if ('serviceWorker' in navigator) {
      const wasControlled = !!navigator.serviceWorker.controller;

      navigator.serviceWorker.addEventListener('message', (e: MessageEvent) => {
        if (e.data?.type === 'RELOAD') {
          window.location.reload();
        }
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (wasControlled) setTimeout(() => window.location.reload(), 150);
      });

      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((reg) => {
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });

        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        const check = () => { reg.update().catch(() => {}); };
        const interval = setInterval(check, 10 * 1000);
        const onFocus = () => check();
        const onOnline = () => check();
        const onVis = () => { if (document.visibilityState === 'visible') check(); };
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVis);
        window.addEventListener('online', onOnline);

        return () => {
          clearInterval(interval);
          window.removeEventListener('focus', onFocus);
          document.removeEventListener('visibilitychange', onVis);
          window.removeEventListener('online', onOnline);
        };
      }).catch(() => {});
    }
  }, []);

  // Canal paralelo de detecção de update: polling de /version.json.
  // Independente do SW lifecycle — essencial em iOS PWA onde o SW
  // às vezes não atualiza sozinho.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    let initialBuildId: string | null = null;
    let stopped = false;

    const fetchVersion = async (): Promise<string | null> => {
      try {
        const res = await fetch(`/version.json?ts=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const data = await res.json();
        const id = typeof data?.buildId === 'string' ? data.buildId : null;
        if (!id || id === '__BUILD_ID__') return null;
        return id;
      } catch {
        return null;
      }
    };

    const check = async () => {
      if (stopped) return;
      const current = await fetchVersion();
      if (!current) return;
      if (initialBuildId === null) {
        initialBuildId = current;
        return;
      }
      if (current !== initialBuildId) {
        stopped = true;
        setUpdateAvailable(true);
      }
    };

    check();
    const interval = setInterval(check, 15 * 1000);
    const onFocus = () => check();
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    const onOnline = () => check();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onOnline);

    return () => {
      stopped = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification.request.content.data);
    });
    return () => sub.remove();
  }, []);

  const { colors } = useTheme();

  // Update PWA theme-color + body background on theme change
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = colors.background;
    document.documentElement.style.backgroundColor = colors.background;
    document.body.style.backgroundColor = colors.background;
  }, [colors.background]);

  const handleUpdate = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch {}
    window.location.reload();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <AppNavigator />
      {updateAvailable && <UpdateBanner onUpdate={handleUpdate} />}
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <TasksProvider>
            <ErrorBoundary>
              <AppInner />
            </ErrorBoundary>
          </TasksProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
