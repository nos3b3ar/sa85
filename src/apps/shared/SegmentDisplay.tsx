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
