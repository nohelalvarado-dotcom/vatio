import React from 'react';
import { OriginLabel } from '../../types/household';

interface OriginBadgeProps {
  origin: OriginLabel;
  size?: 'sm' | 'md';
}

const ORIGIN_CONFIG: Record<
  OriginLabel,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  MEDIDO: {
    label: 'MEDIDO',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/30',
    desc: 'Procede de un instrumento de medición o de una lectura documentada.',
  },
  DECLARADO: {
    label: 'DECLARADO',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/30',
    desc: 'Indicado por el usuario o extraído de la factura y confirmado por él.',
  },
  CALCULADO: {
    label: 'CALCULADO',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-500/30',
    desc: 'Obtenido matemáticamente a partir de datos rigurosos verificables.',
  },
  ESTIMADO: {
    label: 'ESTIMADO',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/30',
    desc: 'Basado en parámetros orientativos, catálogos típicos o supuestos.',
  },
  PREDICHO: {
    label: 'PREDICHO',
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/30',
    desc: 'Proyección estadística hacia un periodo futuro.',
  },
  NO_VERIFICADO: {
    label: 'NO VERIFICADO',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500/30',
    desc: 'No se dispone de documentación suficiente para validar el dato.',
  },
};

export const OriginBadge: React.FC<OriginBadgeProps> = ({ origin, size = 'sm' }) => {
  const config = ORIGIN_CONFIG[origin] || ORIGIN_CONFIG.DECLARADO;

  return (
    <span
      title={config.desc}
      className={`inline-flex items-center font-semibold tracking-wide uppercase rounded border ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      } ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
};
