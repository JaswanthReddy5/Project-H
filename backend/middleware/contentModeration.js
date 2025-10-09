// Hardened content moderation middleware
// - Normalizes input (case-insensitive, removes punctuation/spaces variations, basic leetspeak)
// - Blocks sexual/relationship requests, drugs, weapons/violence, and illegal activity
// - Scans common text fields for items/messages

// Core risky categories
const KEYWORDS = {
  sexual: [
    'sex','sexual','porn','escort','prostitute','hooker','call girl','sex toy','adult','nsfw',
    'girlfriend','boyfriend','ladyboy','lady','dating','marriage','sugar daddy','sugar baby','nude','nudes',
    'be physical','physical relationship','intimate','touch me','come to room'
  ],
  drugs: [
    'drug','drugs','weed','ganja','marijuana','cannabis','cocaine','meth','lsd','heroin','mdma','ecstasy','pills','oxy','opiate','hash'
  ],
  weapons: [
    'bomb','explosive','tnt','weapon','gun','pistol','rifle','ammo','ammunition','knife','acid attack','grenade','make bomb','buy gun','sell gun','explosion'
  ],
  illegal: [
    'hack account','leaked papers','fake id','counterfeit','stolen','blackmail','ransom','hitman','hire killer','sell organs'
  ]
};

// Simple leetspeak map
const LEET_MAP = {
  '0':'o','1':'l','2':'z','3':'e','4':'a','5':'s','6':'g','7':'t','8':'b','9':'g','@':'a','$':'s','!':'i'
};

function normalize(text) {
  if (!text || typeof text !== 'string') return '';
  const lower = text.toLowerCase();
  const deSpaced = lower.replace(/[_-]/g, ' ');
  const deLeet = deSpaced.replace(/[0-9@$!]/g, c => LEET_MAP[c] || c);
  const lettersOnly = deLeet.replace(/[^a-z\s]/g, '');
  return lettersOnly.replace(/\s+/g, ' ').trim();
}

// Build a flat list of normalized keywords and simple regexes
const BANNED_LIST = Object.values(KEYWORDS).flat().map(k => normalize(k));
const BANNED_REGEXES = [
  /\bi\s*want\s*(a|an)?\s*(girlfriend|boyfriend|lady|escort|sex|sex\s*toy)\b/i,
  /\b(can\s*any(one)?\s*)?(make|build)\s*(a\s*)?bomb\b/i,
  /\b(buy|sell)\s*(gun|weapon|drugs|weed|coke|cocaine)\b/i,
  // "i want <name>" pattern (single or two-word proper-like name)
  /\bi\s*want\s+[a-z]{3,}(\s+[a-z]{3,})?\b/i,
  // physical help/being physical phrasing
  /\b(can\s*any(one)?\s*)?help\s*(me\s*)?(to\s*)?(be\s*)?physical(ly)?\b/i,
  /\bbe\s*physical(ly)?\b/i,
  /\b(get|become)\s*intimate\b/i
];

function isInappropriate(raw) {
  const text = normalize(raw);
  if (!text) return false;
  // direct includes on normalized strings
  if (BANNED_LIST.some(k => k && text.includes(k))) return true;
  // regex checks on original for phrasing patterns
  return BANNED_REGEXES.some(r => r.test(raw));
}

// Middleware scans common text fields on create/update item or messages
const contentModeration = (req, res, next) => {
  const candidateFields = [
    req.body.message,
    req.body.work,
    req.body.productName,
    req.body.quantity,
    req.body.description,
    req.body.title,
  ];

  const offending = candidateFields.find(isInappropriate);
  if (offending) {
    return res.status(400).json({
      error: 'Content rejected: Off-topic or unsafe request detected. Keep posts professional and strictly legal/work/product related.'
    });
  }

  next();
};

module.exports = contentModeration; 