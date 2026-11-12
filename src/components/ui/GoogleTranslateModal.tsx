import React, { useState } from 'react';
import { ExternalLink, Globe2, X, ArrowRight } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

interface GoogleTranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
}

export function GoogleTranslateModal({
  isOpen,
  onClose,
  initialText = '',
}: GoogleTranslateModalProps) {
  const { t, language, supportedLanguages } = useI18n();
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState(language === 'es' ? 'en' : 'es');
  const [text, setText] = useState(initialText);

  if (!isOpen) return null;

  const handleOpenGoogleTranslate = () => {
    const encoded = encodeURIComponent(text.trim() || 'VATIO Energy Intelligence');
    const url = `https://translate.google.com/?sl=${sourceLang}&tl=${targetLang}&text=${encoded}&op=translate`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          aria-label={t('close')}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#35D39A]/20 to-[#42C7D9]/20 flex items-center justify-center text-[#35D39A]">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('googleTranslate')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#A7B6CA]">
              {t('googleTranslateDesc')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Language selector pair */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Idioma de origen
              </label>
              <select
                value={sourceLang}
                onChange={e => setSourceLang(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#35D39A]"
              >
                <option value="auto">Detectar automáticamente</option>
                {supportedLanguages.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Idioma de destino
              </label>
              <select
                value={targetLang}
                onChange={e => setTargetLang(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#35D39A]"
              >
                {supportedLanguages.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Text Input */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Texto a traducir
            </label>
            <textarea
              rows={4}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Escribe o pega texto, notas de facturas o términos de energía..."
              className="w-full p-3 text-xs bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#35D39A]"
            />
          </div>

          {/* Action button */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleOpenGoogleTranslate}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-[#35D39A] hover:bg-[#45e3aa] rounded-lg transition-all flex items-center gap-2 shadow-xs"
            >
              <span>{t('translateExternalBtn')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
