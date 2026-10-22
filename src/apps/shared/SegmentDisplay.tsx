import { useEffect, useState } from 'react';

const segments = {
  a: '2,1 11,1 9,3 4,3',
  b: '12,2 12,11 10,10 10,4',
  c: '12,12 12,21 10,19 10,13',
  d: '2,22 4,20 9,20 11,22',
  e: '1,12 3,13 3,19 1,21',
  f: '1,2 3,4 3,10 1,11',
  g: '2,11.5 4,10.5 9,10.5 11,11.5 9,12.5 4,12.5',
} as const;

type Segment = keyof typeof segments;

const glyphs: Record<string, Segment[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'd', 'c'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  '-': ['g'],
  ' ': [],
};

const allSegments = Object.keys(segments) as Segment[];
const digitWidth = 13;
const digitHeight = 23;

type SegmentDisplayProps = {
  value: string;
  on: string;
  off: string;
  className?: string;
  label?: string;
};

export function SegmentDisplay({ value, on, off, className, label }: SegmentDisplayProps) {
  const chars = [...value];
  return (
    <svg
      className={className}
      viewBox={`0 0 ${chars.length * digitWidth} ${digitHeight}`}
      role="img"
      aria-label={label ?? value}
    >
      {chars.map((char, index) => {
        const lit = new Set(glyphs[char] ?? []);
        return (
          <g key={index} transform={`translate(${index * digitWidth} 0)`}>
            {allSegments.map((segment) => (
              <polygon key={segment} points={segments[segment]} fill={lit.has(segment) ? on : off} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

const loaderDigits = 4;
const loaderRing: Array<{ digit: number; segment: Segment }> = [
  { digit: 0, segment: 'a' },
  { digit: 1, segment: 'a' },
  { digit: 2, segment: 'a' },
  { digit: 3, segment: 'a' },
  { digit: 3, segment: 'b' },
  { digit: 3, segment: 'c' },
  { digit: 3, segment: 'd' },
  { digit: 2, segment: 'd' },
  { digit: 1, segment: 'd' },
  { digit: 0, segment: 'd' },
  { digit: 0, segment: 'e' },
  { digit: 0, segment: 'f' },
];

type SegmentLoaderProps = {
  on: string;
  off: string;
  className?: string;
};

/** Vierstellige Sieben-Segment-Anzeige, deren Außenbalken als Ladekreis laufen. */
export function SegmentLoader({ on, off, className }: SegmentLoaderProps) {
  const [step, setStep] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setStep((value) => (value + 1) % loaderRing.length), 90);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <svg
      className={className}
      viewBox={`0 0 ${loaderDigits * digitWidth} ${digitHeight}`}
      role="img"
      aria-label="Laden"
    >
      {Array.from({ length: loaderDigits }, (_, digit) => (
        <g key={digit} transform={`translate(${digit * digitWidth} 0)`}>
          {allSegments.map((segment) => {
            const index = loaderRing.findIndex((item) => item.digit === digit && item.segment === segment);
            if (index < 0) return <polygon key={segment} points={segments[segment]} fill={off} />;
            const age = (step - index + loaderRing.length) % loaderRing.length;
            const lit = reduceMotion || age <= 2;
            const opacity = !lit || reduceMotion || age === 0 ? 1 : age === 1 ? 0.5 : 0.24;
            return (
              <polygon
                key={segment}
                points={segments[segment]}
                fill={lit ? on : off}
                opacity={opacity}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}
