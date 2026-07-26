import { CARD_ALT, CARD_HEIGHT, CARD_WIDTH, renderCard } from './_og/card';

export const alt = CARD_ALT;
export const size = { width: CARD_WIDTH, height: CARD_HEIGHT };
export const contentType = 'image/png';

// Layout lives in ./_og/card so it can also be rendered at 2x — see that file.
export default function Image() {
  return renderCard(1);
}
