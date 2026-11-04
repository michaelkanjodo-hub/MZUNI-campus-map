// Translation-ready strings. Keep Chichewa (ny) and Tumbuka (tum) in separate
// dictionaries later; UI components should gradually consume t(key) instead of
// introducing new hard-coded text. See docs/FUTURE.md for the rollout plan.
const dictionaries = {
  en: {
    appName: 'MZUNI Campus Companion',
    map: 'Map',
    search: 'Search',
    timetable: 'Timetable',
    saved: 'Saved',
    more: 'More',
    navigate: 'Navigate',
    searchPlaceholder: 'Find a building, room or course',
    myLocation: 'My location',
    nextClass: 'Next class',
  },
};

export function createTranslator(language = 'en') {
  const dictionary = dictionaries[language] || dictionaries.en;
  return (key) => dictionary[key] || dictionaries.en[key] || key;
}

export const availableLanguages = [
  { code: 'en', label: 'English', ready: true },
  { code: 'ny', label: 'Chichewa', ready: false },
  { code: 'tum', label: 'Tumbuka', ready: false },
];
