import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'Joseph Celtruda — M.S. Computer Science @ RPI, Software Engineering and Applied AI';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/*
 * Social cards are almost never seen at 1200x630. LinkedIn renders this inside
 * a ~360px-wide box and re-encodes it as JPEG, so every size below is chosen to
 * survive a ~3.3x downscale: four text elements instead of five, and nothing
 * under 38px. The headshot renders near its source resolution (200px) so we
 * don't stack an upscale on top of that downscale.
 *
 * Colors and the background glow are sampled from the original hand-made card
 * so the styling is unchanged — only the sizes grew. Note the trade-off: the
 * grey ramp (#A0A0A0 / #909090) is chosen for looks over small-size contrast,
 * so the type sizes are what carry legibility at LinkedIn scale. Shrinking them
 * back down would undo the fix.
 */
export default async function Image() {
  const [inter600, inter700, headshot] = await Promise.all([
    readFile(join(process.cwd(), 'src/app/fonts/inter-600.woff')),
    readFile(join(process.cwd(), 'src/app/fonts/inter-700.woff')),
    readFile(join(process.cwd(), 'public/headshot-cropped.jpg')),
  ]);

  const headshotSrc = `data:image/jpeg;base64,${headshot.toString('base64')}`;

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
            height: 8,
            backgroundImage: 'linear-gradient(90deg, #1E5AA8 0%, #38BDF8 100%)',
          }}
        />

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 64px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 100,
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
                marginTop: 22,
                fontSize: 46,
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
                marginTop: 10,
                fontSize: 46,
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
                marginTop: 34,
                fontSize: 38,
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
            width={224}
            height={224}
            alt=""
            style={{
              borderRadius: '50%',
              border: '7px solid #38BDF8',
              objectFit: 'cover',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Inter', data: inter600, weight: 600, style: 'normal' },
        { name: 'Inter', data: inter700, weight: 700, style: 'normal' },
      ],
    }
  );
}
