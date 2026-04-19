import type { Lang } from '@/lib/i18n';

const EN_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});
const EN_TIME = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit'
});
const ZH_DATE = new Intl.DateTimeFormat('zh-CN', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});
const ZH_TIME = new Intl.DateTimeFormat('zh-CN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: false
});

export function formatWorkspaceTimestamp(timestamp: number | null, lang: Lang = 'en') {
  if (timestamp === null) {
    return lang === 'zh' ? '暂无证据' : 'No evidence yet';
  }

  const date = new Date(timestamp);
  if (lang === 'zh') {
    return `${ZH_DATE.format(date)} ${ZH_TIME.format(date)}`;
  }
  return `${EN_DATE.format(date)} at ${EN_TIME.format(date)}`;
}

export function formatWorkspaceDay(timestamp: number, lang: Lang = 'en') {
  const date = new Date(timestamp);
  if (lang === 'zh') return ZH_DATE.format(date);
  return EN_DATE.format(date);
}

export function formatWorkspaceTime(timestamp: number, lang: Lang = 'en') {
  const date = new Date(timestamp);
  if (lang === 'zh') return ZH_TIME.format(date);
  return EN_TIME.format(date);
}

export function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function relativeDayLabel(
  ts: number,
  lang: Lang,
  nowTs: number = Date.now()
): string | null {
  const today = startOfDay(nowTs);
  const day = startOfDay(ts);
  const diff = (today - day) / (24 * 60 * 60 * 1000);
  if (diff === 0) return lang === 'zh' ? '今天' : 'Today';
  if (diff === 1) return lang === 'zh' ? '昨天' : 'Yesterday';
  if (diff > 0 && diff < 7) {
    return lang === 'zh' ? `${diff} 天前` : `${diff} days ago`;
  }
  return null;
}
