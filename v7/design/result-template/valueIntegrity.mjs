// Only the capture boundary can attest that a value is complete and untouched.
// The renderer must never infer this from its length, tag name or lack of “…”.
export const isCompleteOriginal = field => field[3] === 'complete-original'
export const representationLabel = field => ({
  excerpt: 'Excerpt — incomplete',
  derived: 'Reconstructed representation',
}[field[3]] || 'Completeness not verified')
