import type { RightsCard } from '@nyayasetu/shared-types';
import { CardStandard } from './CardStandard';
import { CardCrisis } from './CardCrisis';
import { CardMythBuster } from './CardMythBuster';
import { CardProcedure } from './CardProcedure';
import { CardQuickRef } from './CardQuickRef';

export const CARD_CATEGORY_COLORS: Record<string, { accent: string; bg: string; glow: string }> = {
  'fundamental-rights': { accent: '#a78bfa', bg: '#7c3aed', glow: 'rgba(124,58,237,0.35)' },
  'police-powers':      { accent: '#f87171', bg: '#dc2626', glow: 'rgba(220,38,38,0.35)' },
  'traffic-laws':       { accent: '#fb923c', bg: '#ea580c', glow: 'rgba(234,88,12,0.35)' },
  'tenancy':            { accent: '#34d399', bg: '#059669', glow: 'rgba(5,150,105,0.35)' },
  'consumer-rights':    { accent: '#60a5fa', bg: '#2563eb', glow: 'rgba(37,99,235,0.35)' },
  'workplace-rights':   { accent: '#fbbf24', bg: '#d97706', glow: 'rgba(217,119,6,0.35)' },
};

export const VARIANT_LABELS: Record<string, string> = {
  'standard':    'Know Your Rights',
  'crisis':      'Crisis Guide',
  'myth-buster': 'Myth vs Law',
  'procedure':   'Step-by-Step',
  'quick-ref':   'Quick Reference',
};

export const VARIANT_ICONS: Record<string, string> = {
  'standard':    '⚖️',
  'crisis':      '🚨',
  'myth-buster': '🔍',
  'procedure':   '📋',
  'quick-ref':   '📌',
};

interface Props {
  card: RightsCard;
}

export function CardRenderer({ card }: Props) {
  const colors = CARD_CATEGORY_COLORS[card.category] ?? { accent: '#94a3b8', bg: '#475569', glow: 'rgba(71,85,105,0.35)' };

  switch (card.variant) {
    case 'standard':
      return <CardStandard card={card} accentColor={colors.accent} />;
    case 'crisis':
      return <CardCrisis card={card} />;
    case 'myth-buster':
      return <CardMythBuster card={card} accentColor={colors.accent} />;
    case 'procedure':
      return <CardProcedure card={card} accentColor={colors.accent} />;
    case 'quick-ref':
      return <CardQuickRef card={card} accentColor={colors.accent} />;
  }
}
