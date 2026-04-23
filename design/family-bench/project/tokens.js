// Family Bench — design tokens
// Modern court aesthetic: clean off-white, near-black ink, precise hairlines.
// Sans-first with a restrained serif for case captions + numerals.

window.FB = {
  // Color — bright, precise, court-modern
  paper: '#F7F6F3',         // neutral warm off-white
  paperDeep: '#EFEDE7',     // card / recessed panel
  paperEdge: '#E4E1D9',     // hairlines
  ink: '#14181F',           // near-black, primary text
  inkSoft: '#2B323D',
  inkMute: 'rgba(20,24,31,0.58)',
  inkFaint: 'rgba(20,24,31,0.34)',
  rule: 'rgba(20,24,31,0.10)',
  ruleSoft: 'rgba(20,24,31,0.06)',
  ox: '#B44028',            // modern oxblood / alert red
  oxDeep: '#842E1C',
  oxWash: '#F4E3DE',
  sand: '#C9B892',
  sandDeep: '#8A7647',
  sandWash: '#F0EADA',
  forest: '#2F5A3A',        // verified / success
  forestWash: '#DEE8DD',
  amber: '#A76A14',
  amberWash: '#F3E6CE',

  // Type — modern, precise
  serif: '"Instrument Serif", "Source Serif 4", Georgia, serif', // used sparingly — captions, figures
  sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
};

// Inject fonts + base styles once
if (typeof document !== 'undefined' && !document.getElementById('fb-fonts')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap';
  document.head.appendChild(link);
  const s = document.createElement('style');
  s.id = 'fb-fonts';
  s.textContent = `
    .fb-serif { font-family: ${window.FB.serif}; font-feature-settings: "lnum"; letter-spacing: -0.005em; }
    .fb-sans  { font-family: ${window.FB.sans}; font-feature-settings: "ss01", "cv11"; }
    .fb-mono  { font-family: ${window.FB.mono}; font-feature-settings: "tnum", "zero"; }
    .fb-scroll::-webkit-scrollbar{ display:none }
    .fb-scroll{ scrollbar-width:none }
    .fb-smallcaps { font-variant: all-small-caps; letter-spacing: 0.11em; }
    .fb-tnum { font-variant-numeric: tabular-nums; }
    .fb-tight { letter-spacing: -0.025em; }
  `;
  document.head.appendChild(s);
}

// Shared sample case
window.FB_CASE = {
  caption: 'In re: Marriage of Chen',
  caseNo: 'FL-24-0918',
  court: 'Superior Court of California · County of Alameda',
  dept: 'Dept. 24',
  judge: 'Hon. M. Alvarado',
  hearing: { date: 'May 5, 2026', days: 14, type: 'RFO · Custody Modification' },
  parties: { pet: 'Sarah Chen (Petitioner, pro se)', resp: 'David Chen (Respondent)' },
  child: { name: 'Leonie Chen', age: 7 },
  split: { scheduled: '50 / 50', actual: '38 / 62', delta: '−12 overnights / 90 d' },
};
