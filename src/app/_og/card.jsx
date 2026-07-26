import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

export const CARD_ALT =
  'Joseph Celtruda — M.S. Computer Science @ RPI, Software Engineering and Applied AI';

/*
 * Social cards are almost never seen at 1200x630. LinkedIn renders this inside
 * a ~360px-wide box and re-encodes it as JPEG, so every size below is chosen to
 * survive a ~3.3x downscale: four text elements instead of five, and nothing
 * under 38px.
 *
 * Colors and the background glow are sampled from the original hand-made card
 * so the styling is unchanged — only the sizes grew. Note the trade-off: the
 * grey ramp (#A0A0A0 / #909090) is chosen for looks over small-size contrast,
 * so the type sizes are what carry legibility at LinkedIn scale. Shrinking them
 * back down would undo that.
 *
 * Every length is multiplied by `scale` so the same layout can be rendered at
 * 2x for contexts that display the card larger than a link preview (e.g. a
 * manual upload). Percentages in the gradient are scale-invariant already.
 * public/headshot-cropped.jpg is 640x640, so it still downsamples — never
 * upsamples — at 2x.
 */
export async function renderCard(scale = 1) {
  const [inter600, inter700, headshot] = await Promise.all([
    readFile(join(process.cwd(), 'src/app/fonts/inter-600.woff')),
    readFile(join(process.cwd(), 'src/app/fonts/inter-700.woff')),
    readFile(join(process.cwd(), 'public/headshot-cropped.jpg')),
  ]);

  const headshotSrc = `data:image/jpeg;base64,${headshot.toString('base64')}`;
  const s = (n) => n * scale;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1A1A1A',
          // Sky-blue glow up behind the headshot, fitted to the original card's
          // measured falloff — the intermediate stops keep it from washing all
          // the way down to the bottom edge.
          backgroundImage: [
            'radial-gradient(circle at 77% 19%,',
            'rgba(56, 189, 248, 0.115) 0%,',
            'rgba(56, 189, 248, 0.06) 16%,',
            'rgba(56, 189, 248, 0.03) 30%,',
            'rgba(56, 189, 248, 0) 50%)',
          ].join(' '),
          fontFamily: 'Inter',
        }}
      >
        {/* Deep blue holds, sky blue signals. */}
        <div
          style={{
            height: s(8),
            backgroundImage: 'linear-gradient(90deg, #1E5AA8 0%, #38BDF8 100%)',
          }}
        />

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `0 ${s(64)}px`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: s(100),
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                color: '#FFFFFF',
              }}
            >
              Joseph Celtruda
            </div>
            <div
              style={{
                marginTop: s(22),
                fontSize: s(46),
                fontWeight: 600,
                letterSpacing: '-0.01em',
                lineHeight: 1.25,
                color: '#A0A0A0',
              }}
            >
              M.S. Computer Science @ RPI
            </div>
            <div
              style={{
                marginTop: s(10),
                fontSize: s(46),
                fontWeight: 700,
                letterSpacing: '-0.01em',
                lineHeight: 1.25,
                color: '#38BDF8',
              }}
            >
              Software Engineering · Applied AI
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: s(34),
                fontSize: s(38),
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: '#909090',
              }}
            >
              joeceltruda.dev
            </div>
          </div>

          {/* Satori renders raw <img> only — next/image has no meaning here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={headshotSrc}
            width={s(224)}
            height={s(224)}
            alt=""
            style={{
              borderRadius: '50%',
              border: `${s(7)}px solid #38BDF8`,
              objectFit: 'cover',
              boxShadow: `0 ${s(8)}px ${s(24)}px rgba(0, 0, 0, 0.45)`,
            }}
          />
        </div>
      </div>
    ),
    {
      width: s(CARD_WIDTH),
      height: s(CARD_HEIGHT),
      fonts: [
        { name: 'Inter', data: inter600, weight: 600, style: 'normal' },
        { name: 'Inter', data: inter700, weight: 700, style: 'normal' },
      ],
    }
  );
}
