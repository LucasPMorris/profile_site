import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') ?? 'Blog by Lucas Morris';
  const image = searchParams.get('image') ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
        }}
      >
        {image ? (
          <img
            src={image}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            }}
          />
        )}
        {/* Gradient overlay for text readability */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '50%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            display: 'flex',
          }}
        />
        {/* Title text */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 40,
            right: 40,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.2,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              color: 'rgba(255,255,255,0.8)',
              marginTop: 12,
            }}
          >
            lucas.untethered4life.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
