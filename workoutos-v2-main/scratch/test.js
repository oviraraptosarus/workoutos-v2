const parseTimeRobust = (t) => {
  if (typeof t !== 'string' || !t) return null;
  const match = t.match(/(\d{1,2})[:.]?(\d{2})?(?::\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?/i);
  if (!match) {
    return null;
  }
  let h = parseInt(match[1], 10);
  const m = match[2] || '00';
  const ampm = match[3]?.toLowerCase();
  
  if (ampm) {
    if (ampm.startsWith('p') && h < 12) h += 12;
    if (ampm.startsWith('a') && h === 12) h = 0;
  } else {
    if (h >= 24) return null;
  }
  
  return `${String(h).padStart(2, '0')}:${m}:00`;
};

const tests = [
  '10:00 PM', '10 PM', '23:00', '23:00:00', 'around 10 PM', '10.30 pm', 
  'I went to bed at 11.45p.m.', '00:30', '12:00 AM', '12:00 PM', '10'
];

tests.forEach(t => console.log(`${t} -> ${parseTimeRobust(t)}`));
