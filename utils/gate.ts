import { GateSubject } from '../types';

// The 11 standard GATE CSE subjects. Stable ids so the synced slice merges cleanly.
const SUBJECTS: { id: string; name: string }[] = [
  { id: 'maths', name: 'Engineering Mathematics' },
  { id: 'digital', name: 'Digital Logic' },
  { id: 'coa', name: 'Computer Organization & Architecture' },
  { id: 'pds', name: 'Programming & Data Structures' },
  { id: 'algo', name: 'Algorithms' },
  { id: 'toc', name: 'Theory of Computation' },
  { id: 'compiler', name: 'Compiler Design' },
  { id: 'os', name: 'Operating Systems' },
  { id: 'dbms', name: 'Databases (DBMS)' },
  { id: 'cn', name: 'Computer Networks' },
  { id: 'aptitude', name: 'General Aptitude' },
];

export const DEFAULT_GATE_SUBJECTS = (): GateSubject[] =>
  SUBJECTS.map(s => ({ id: s.id, name: s.name, videos: [], testsDone: 0, testsTarget: 10 }));

export const coverage = (s: GateSubject): number =>
  s.videos.length ? s.videos.filter(v => v.done).length / s.videos.length : 0;

export const testProgress = (s: GateSubject): number =>
  s.testsTarget > 0 ? Math.min(1, s.testsDone / s.testsTarget) : 0;
