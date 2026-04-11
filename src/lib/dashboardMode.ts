export type DashboardMode =
  | 'below_100'
  | 'one_hundred_scheduler'
  | 'one_hundred_pt'
  | 'tdiu_unemployable';

export const DASHBOARD_MODE_LABELS: Record<DashboardMode, string> = {
  below_100: 'Below 100%',
  one_hundred_scheduler: '100% Scheduler',
  one_hundred_pt: '100% P&T',
  tdiu_unemployable: 'TDIU / Unemployable',
};

export const DASHBOARD_MODE_OPTIONS = [
  {
    value: 'below_100',
    label: DASHBOARD_MODE_LABELS.below_100,
  },
  {
    value: 'one_hundred_scheduler',
    label: DASHBOARD_MODE_LABELS.one_hundred_scheduler,
  },
  {
    value: 'one_hundred_pt',
    label: DASHBOARD_MODE_LABELS.one_hundred_pt,
  },
  {
    value: 'tdiu_unemployable',
    label: DASHBOARD_MODE_LABELS.tdiu_unemployable,
  },
] as const;

export interface DashboardModeProfile {
  va_rating_level?: string | null;
  va_is_pt?: boolean | null;
  va_is_tdiu?: boolean | null;
}

export function getDashboardMode(profile?: DashboardModeProfile | null): DashboardMode {
  let resolvedMode: DashboardMode;

  if (profile?.va_is_tdiu === true) {
    resolvedMode = 'tdiu_unemployable';
  } else if (profile?.va_rating_level === 'one_hundred' && profile?.va_is_pt === true) {
    // A 100% rating level by itself does not mean Permanent & Total.
    // Only return P&T when the profile includes an explicit P&T signal.
    resolvedMode = 'one_hundred_pt';
  } else if (profile?.va_rating_level === 'one_hundred') {
    // Keep schedular 100% separate from P&T.
    // If P&T is not explicitly set, a 100% rating level stays schedular.
    resolvedMode = 'one_hundred_scheduler';
  } else {
    resolvedMode = 'below_100';
  }

  console.log('[getDashboardMode] va_rating_level:', profile?.va_rating_level);
  console.log('[getDashboardMode] va_is_pt:', profile?.va_is_pt);
  console.log('[getDashboardMode] va_is_tdiu:', profile?.va_is_tdiu);
  console.log('[getDashboardMode] resolved dashboard mode:', resolvedMode);

  return resolvedMode;
}

export function getDashboardModeLabel(mode: DashboardMode): string {
  return DASHBOARD_MODE_LABELS[mode];
}
