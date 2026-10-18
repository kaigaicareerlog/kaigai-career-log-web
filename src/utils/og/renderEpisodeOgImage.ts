import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import { loadDefaultJapaneseParser } from 'budoux';
import satori from 'satori';
import type { EpisodeGuest } from '../../types';
import { fitTitleFontSize } from './fitTitle';
import { splitEpisodeTitle } from './splitEpisodeTitle';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export interface EpisodeOgImageInput {
  title: string;
  guests: EpisodeGuest[];
  /** City and country labels, e.g. ['バンクーバー', 'カナダ'] */
  places: string[];
}

// Site colours (global.css: brand = sky, text = zinc)
const COLOR = {
  brand: '#0369a1',
  brandSoft: '#f0f9ff',
  brandBorder: '#bae6fd',
  text: '#09090b',
  muted: '#52525b',
};

// Width available to the title: image width minus the side padding
const TITLE_MAX_WIDTH = OG_IMAGE_WIDTH - 64 * 2;

const ASSETS_DIR = path.join(process.cwd(), 'src', 'assets');
// Lucide "map-pin", drawn in the brand colour
const PIN_ICON = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${COLOR.brand}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`
).toString('base64')}`;

let assets: {
  fonts: Parameters<typeof satori>[1]['fonts'];
  logo: string;
} | null = null;

function loadAssets() {
  assets ??= {
    fonts: [
      {
        name: 'Noto Sans JP',
        data: fs.readFileSync(
          path.join(ASSETS_DIR, 'fonts', 'NotoSansJP-Regular.ttf')
        ),
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Noto Sans JP',
        data: fs.readFileSync(
          path.join(ASSETS_DIR, 'fonts', 'NotoSansJP-Bold.ttf')
        ),
        weight: 700,
        style: 'normal',
      },
    ],
    logo: `data:image/png;base64,${fs
      .readFileSync(path.join(ASSETS_DIR, 'og-logo.png'))
      .toString('base64')}`,
  };
  return assets;
}

const parser = loadDefaultJapaneseParser();

type Node = { type: string; props: Record<string, unknown> };
const el = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown
): Node => ({ type, props: { style, children } });

function chip(label: string, filled = false, icon?: string): Node {
  return el(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      padding: '6px 18px',
      borderRadius: 999,
      fontSize: 24,
      fontWeight: 700,
      color: filled ? '#ffffff' : COLOR.brand,
      background: filled ? COLOR.brand : COLOR.brandSoft,
      border: `2px solid ${filled ? COLOR.brand : COLOR.brandBorder}`,
    },
    [
      ...(icon
        ? [
            {
              type: 'img',
              props: {
                src: icon,
                width: 22,
                height: 22,
                style: { marginRight: 6 },
              },
            },
          ]
        : []),
      label,
    ]
  );
}

/** "Yu さん" and "マーケティングスペシャリスト @ Telus", or the site domain */
function guestBlock(guests: EpisodeGuest[]): Node {
  const named = guests.filter((guest) => guest.name);
  if (named.length === 0) {
    return el(
      'div',
      { display: 'flex', fontSize: 28, color: COLOR.muted },
      'kaigaicareerlog.com'
    );
  }

  const [first] = named;
  const role = [first.position, first.company && `@ ${first.company}`]
    .filter(Boolean)
    .join(' ');

  return el('div', { display: 'flex', flexDirection: 'column' }, [
    el('div', { display: 'flex', alignItems: 'baseline' }, [
      el(
        'div',
        { display: 'flex', fontSize: 40, fontWeight: 700, color: COLOR.text },
        named.map((guest) => guest.name).join('・')
      ),
      el(
        'div',
        { display: 'flex', marginLeft: 8, fontSize: 28, color: COLOR.muted },
        'さん'
      ),
    ]),
    ...(role
      ? [
          el(
            'div',
            { display: 'flex', marginTop: 6, fontSize: 28, color: COLOR.muted },
            role
          ),
        ]
      : []),
  ]);
}

/** The element tree for an episode's share image (satori's input) */
export function buildEpisodeOgImageTree(
  input: EpisodeOgImageInput,
  logo: string
): Node {
  const { main, part, special, number } = splitEpisodeTitle(input.title);
  // One element per phrase so lines break only between phrases, never in
  // the middle of a word
  const phrases = parser.parse(main);
  const fontSize = fitTitleFontSize(phrases, TITLE_MAX_WIDTH);
  const lineHeight = Math.round(fontSize * 1.35);

  return el(
    'div',
    {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff',
      fontFamily: 'Noto Sans JP',
    },
    [
      el('div', { display: 'flex', height: 14, background: COLOR.brand }),
      el(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '40px 64px 48px',
        },
        [
          el(
            'div',
            {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
            [
              el('div', { display: 'flex', alignItems: 'center' }, [
                {
                  type: 'img',
                  props: { src: logo, width: 80, height: 80 },
                },
                el(
                  'div',
                  {
                    display: 'flex',
                    marginLeft: 16,
                    fontSize: 32,
                    fontWeight: 700,
                    color: COLOR.text,
                  },
                  '海外キャリアログ'
                ),
              ]),
              el('div', { display: 'flex', gap: 12 }, [
                ...(special ? [chip(special)] : []),
                ...(part ? [chip(part)] : []),
                ...(number ? [chip(`#${number}`, true)] : []),
              ]),
            ]
          ),
          el(
            'div',
            {
              display: 'flex',
              flexWrap: 'wrap',
              marginTop: 32,
              // Sized to fit in 3 lines; anything beyond is cut at a phrase boundary
              maxHeight: lineHeight * 3,
              overflow: 'hidden',
              fontSize,
              fontWeight: 700,
              lineHeight: `${lineHeight}px`,
              color: COLOR.text,
            },
            phrases.map((phrase) =>
              el('div', { display: 'flex', whiteSpace: 'nowrap' }, phrase)
            )
          ),
          el('div', { display: 'flex', flex: 1 }),
          el(
            'div',
            {
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            },
            [
              guestBlock(input.guests),
              el(
                'div',
                { display: 'flex', gap: 10 },
                input.places.map((place) => chip(place, false, PIN_ICON))
              ),
            ]
          ),
        ]
      ),
    ]
  );
}

/** Render an episode's share image as PNG */
export async function renderEpisodeOgImage(
  input: EpisodeOgImageInput
): Promise<Buffer> {
  const { fonts, logo } = loadAssets();
  const svg = await satori(
    buildEpisodeOgImageTree(input, logo) as Parameters<typeof satori>[0],
    { width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, fonts }
  );
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: OG_IMAGE_WIDTH },
  })
    .render()
    .asPng();
}
