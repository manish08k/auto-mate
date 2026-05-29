const formatDate = {
  full: (date) => {
    if (!date) return '—';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  },

  short: (date) => {
    if (!date) return '—';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  },

  time: (date) => {
    if (!date) return '—';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(date));
  },

  datetime: (date) => {
    if (!date) return '—';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(date));
  },

  relative: (date) => {
    if (!date) return '—';
    const now = Date.now();
    const then = new Date(date).getTime();
    const diff = now - then;
    const abs = Math.abs(diff);
    const future = diff < 0;
    const prefix = future ? 'in ' : '';
    const suffix = future ? '' : ' ago';

    if (abs < 60_000)       return 'just now';
    if (abs < 3_600_000)    return `${prefix}${Math.floor(abs / 60_000)}m${suffix}`;
    if (abs < 86_400_000)   return `${prefix}${Math.floor(abs / 3_600_000)}h${suffix}`;
    if (abs < 604_800_000)  return `${prefix}${Math.floor(abs / 86_400_000)}d${suffix}`;
    if (abs < 2_592_000_000) return `${prefix}${Math.floor(abs / 604_800_000)}w${suffix}`;
    if (abs < 31_536_000_000) return `${prefix}${Math.floor(abs / 2_592_000_000)}mo${suffix}`;
    return `${prefix}${Math.floor(abs / 31_536_000_000)}y${suffix}`;
  },

  duration: (ms) => {
    if (ms == null || isNaN(ms)) return '—';
    if (ms < 1_000)   return `${ms}ms`;
    if (ms < 60_000)  return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3_600_000) {
      const m = Math.floor(ms / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      return s > 0 ? `${m}m ${s}s` : `${m}m`;
    }
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  },

  iso: (date) => {
    if (!date) return '';
    return new Date(date).toISOString();
  },

  isValid: (date) => {
    if (!date) return false;
    const d = new Date(date);
    return !isNaN(d.getTime());
  },
};

export default formatDate;
