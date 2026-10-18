/**
 * Platzhalter für das Mainboard-Logo. Später leicht austauschbar.
 * Passende Boards der Zeit: ASUS P2B (440BX, Pentium II),
 * Abit BH6, ASUS P/I-P55T2P4 (Sockel 7, falls es ein Pentium 1 sein soll).
 */
export function BoardLogo() {
  return (
    <svg className="board-logo" viewBox="0 0 32 32" role="img" aria-label="Mainboard-Logo">
      <circle cx="16" cy="16" r="14" fill="#0c2f92" stroke="#b9ecff" strokeWidth="2" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="#7fdfff" strokeWidth="1" />
      <path d="M16 7.2 18.2 13H24l-4.7 3.4 1.8 5.6L16 18.6l-5.1 3.4 1.8-5.6L8 13h5.8z" fill="#e7f7ff" />
    </svg>
  );
}
