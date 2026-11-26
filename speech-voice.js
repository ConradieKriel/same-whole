// Choose one recognisably female English voice from the voices installed
// by the learner's browser or device. The selected voice stays the same
// for every tutor message during that page session.
const FEMALE_VOICE_NAME_HINTS = [
  'tessa',
  'samantha',
  'karen',
  'moira',
  'fiona',
  'victoria',
  'zira',
  'hazel',
  'susan',
  'jenny',
  'aria',
  'sonia',
  'natasha',
  'emma',
  'amy',
  'ava',
  'serena',
  'libby',
  'olivia',
  'charlotte',
];

/**
 * Return the best available female-sounding English voice, or null when the
 * installed voice list has no clearly identifiable female English option.
 * The Web Speech API does not expose a standard voice-gender property, so
 * this uses common built-in voice names and explicit "female" labels.
 */
export function chooseFemaleEnglishVoice(voices = []) {
  const englishVoices = voices.filter((voice) => /^en(?:-|_|$)/i.test(voice.lang || ''));
  if (!englishVoices.length) return null;

  const scoredVoices = englishVoices
    .map((voice, index) => {
      const name = String(voice.name || '').toLowerCase();
      const femaleLabel = /\bfemale\b/.test(name);
      const nameHintIndex = FEMALE_VOICE_NAME_HINTS.findIndex((hint) => name.includes(hint));

      // Do not guess that an unfamiliar voice is female.
      if (!femaleLabel && nameHintIndex === -1) return null;

      let score = femaleLabel ? 1000 : 700 - nameHintIndex * 10;
      if (/natural|neural/i.test(name)) score += 80;
      if (/^en[-_]za$/i.test(voice.lang || '')) score += 400;
      else if (/^en[-_]gb$/i.test(voice.lang || '')) score += 80;
      else if (/^en[-_]au$/i.test(voice.lang || '')) score += 60;
      else if (/^en[-_]us$/i.test(voice.lang || '')) score += 40;
      if (voice.default) score += 5;

      return { voice, score, index };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return scoredVoices[0]?.voice || null;
}
