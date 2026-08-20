import ch01 from '../../data/chapter01.json';
import ch02 from '../../data/chapter02.json';
import ch03 from '../../data/chapter03.json';
import ch04 from '../../data/chapter04.json';
import ch05 from '../../data/chapter05.json';
import ch06 from '../../data/chapter06.json';
import ch07 from '../../data/chapter07.json';
import ch08 from '../../data/chapter08.json';
import ch09 from '../../data/chapter09.json';
import ch10 from '../../data/chapter10.json';
import ch11 from '../../data/chapter11.json';
import ch12 from '../../data/chapter12.json';
import ch13 from '../../data/chapter13.json';
import ch14 from '../../data/chapter14.json';
import ch15 from '../../data/chapter15.json';
import ch16 from '../../data/chapter16.json';
import ch17 from '../../data/chapter17.json';

const chapters = [
  { chapter: 1, verses: ch01 },
  { chapter: 2, verses: ch02 },
  { chapter: 3, verses: ch03 },
  { chapter: 4, verses: ch04 },
  { chapter: 5, verses: ch05 },
  { chapter: 6, verses: ch06 },
  { chapter: 7, verses: ch07 },
  { chapter: 8, verses: ch08 },
  { chapter: 9, verses: ch09 },
  { chapter: 10, verses: ch10 },
  { chapter: 11, verses: ch11 },
  { chapter: 12, verses: ch12 },
  { chapter: 13, verses: ch13 },
  { chapter: 14, verses: ch14 },
  { chapter: 15, verses: ch15 },
  { chapter: 16, verses: ch16 },
  { chapter: 17, verses: ch17 },
];

// Flatten into sequential chronological array of verses with chapter metadata
const ALL_VERSES = chapters.flatMap(({ chapter, verses }) =>
  verses.map((v) => ({
    chapter,
    verse: parseInt(v.verse_id, 10) || v.verse_id,
    text: (v.text || '').trim(),
  }))
);

// Base start date: 20th August 2026 (Month index 7 in JavaScript Date is August)
const BASE_YEAR = 2026;
const BASE_MONTH = 7;
const BASE_DAY = 20;

export const VerseService = {
  /**
   * Get the verse corresponding to a given date.
   * Advances by 1 verse each calendar day in chronological order.
   */
  getVerseForDate(date = new Date()) {
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const base = new Date(BASE_YEAR, BASE_MONTH, BASE_DAY);
    base.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - base.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const total = ALL_VERSES.length;
    const dayOffset = diffDays < 0 ? 0 : diffDays;
    const index = dayOffset % total;

    return ALL_VERSES[index] || ALL_VERSES[0];
  },

  /**
   * Get today's verse
   */
  getTodaysVerse() {
    return this.getVerseForDate(new Date());
  },

  /**
   * Total number of verses across all chapters
   */
  getTotalVersesCount() {
    return ALL_VERSES.length;
  },
};
