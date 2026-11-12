/**
 * VATIO · Detección de plataforma
 *
 * La app compila a tres sabores desde el mismo código:
 *  - NATIVE  : dentro del WebView de Capacitor (Android APK/AAB para Play Console) → SIEMPRE vista móvil.
 *  - WEB     : navegador normal → layout de escritorio (sidebar) en PCs, layout móvil en teléfonos.
 *
 * En desarrollo se puede forzar una plataforma con ?platform=native|web o con
 * localStorage 'vatio_platform_override'.
 */

export type PlatformMode = 'native' | 'web';

let cached: PlatformMode | null = null;

export function detectPlatform(): PlatformMode {
  if (cached) return cached;

  // 1. Override manual para probar (URL ?platform= o localStorage)
  try {
    const params = new URLSearchParams(window.location.search);
    const urlOverride = params.get('platform');
    const lsOverride = localStorage.getItem('vatio_platform_override');
    const override = urlOverride || lsOverride;
    if (override === 'native') {
      cached = 'native';
      return cached;
    }
    if (override === 'web') {
      cached = 'web';
      return cached;
    }
  } catch {
    /* noop */
  }

  // 2. Dentro de Capacitor (Android/iOS) siempre es la app móvil
  const cap = (window as any).Capacitor;
  if (cap?.isNativePlatform?.() || cap?.getPlatform?.() === 'android' || cap?.getPlatform?.() === 'ios') {
    cached = 'native';
    return cached;
  }

  // 3. Heurísticas de WebView (por si Capacitor no expone el puente aún)
  const ua = navigator.userAgent || '';
  const isWebView =
    /\bwv\b/.test(ua) || // Android WebView
    ua.includes('vatio-android'); // user-agent personalizado de la app

  cached = isWebView ? 'native' : 'web';
  return cached;
}

export function isNativeApp(): boolean {
  return detectPlatform() === 'native';
}

/**
 * ¿Estamos renderizando DENTRO del marco de previsualización (iframe)?
 * El componente PhonePreview monta la app en un iframe de 390px; dentro de
 * ese iframe los breakpoints de Tailwind (md:, lg:) funcionan con el ancho
 * REAL del teléfono, igual que en AI Studio.
 */
export function isInPhoneFrame(): boolean {
  try {
    return window.self !== window.top || new URLSearchParams(window.location.search).get('preview') === 'inner';
  } catch {
    // Acceso restringido entre orígenes ⇒ estamos dentro de un iframe
    return true;
  }
}

/**
 * Modo de previsualización solo para desarrolladores (web).
 * 'phone' renderiza la interfaz móvil dentro de un marco de teléfono (iframe).
 * No afecta builds nativos ni a usuarios finales.
 */
export type PreviewMode = 'desktop' | 'phone';

export function getPreviewMode(): PreviewMode {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('preview') === 'phone' || localStorage.getItem('vatio_preview') === 'phone'
      ? 'phone'
      : 'desktop';
  } catch {
    return 'desktop';
  }
}

export function setPreviewMode(mode: PreviewMode) {
  try {
    if (mode === 'phone') {
      localStorage.setItem('vatio_preview', 'phone');
    } else {
      localStorage.removeItem('vatio_preview');
    }
    window.location.reload();
  } catch {
    /* noop */
  }
}
