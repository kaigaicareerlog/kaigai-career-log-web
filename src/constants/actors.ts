import type { Actor, HostInfo } from '../types';

export const RYO: Actor = {
  name: 'Ryo',
  bio: 'VancouverのAsanaでソフトウェアエンジニアをしています。バレー/テニス/サッカー/ストレッチ好き',
  avatar: '/ryo.JPG',
  color: '#3b82f6', // blue
  socialLinks: [
    {
      href: 'https://x.com/togashi_ryo',
      icon: 'https://abs.twimg.com/favicons/twitter.3.ico',
      title: 'X (Twitter)',
    },
    {
      href: 'https://www.linkedin.com/in/ryotogashi/',
      icon: 'https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
      title: 'LinkedIn',
    },
  ],
};

export const SENNA: Actor = {
  name: 'Senna',
  bio: '日本で最も多くのIT専門職の海外就職者をサポートしてきたFrog代表。アメリカのスタートアップを中心に投資。カナダの海外就職やキャリア情報の発信は主にXから行うことが多いです！',
  avatar: '/senna.jpg',
  color: '#ec4899', // pink
  socialLinks: [
    {
      href: 'https://x.com/onepercentdsgn',
      icon: 'https://abs.twimg.com/favicons/twitter.3.ico',
      title: 'X (Twitter)',
    },
  ],
};

export const AYAKA: Actor = {
  name: 'Ayaka',
  bio: '未経験からVancouverでソフトウェアエンジニアになりました。暮らすように旅するのが好き。現在の目標は朝型人間になる。',
  avatar: '/ayaka.jpg',
  color: '#8b5cf6', // purple
  socialLinks: [
    {
      href: 'https://x.com/ayacappuccino',
      icon: 'https://abs.twimg.com/favicons/twitter.3.ico',
      title: 'X (Twitter)',
    },
    {
      href: 'https://www.linkedin.com/in/ayaka-yasuda-7ab597197/',
      icon: 'https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
      title: 'LinkedIn',
    },
  ],
};

export const HOSTS: Actor[] = [RYO, SENNA, AYAKA];

/**
 * Get host information by name (for transcripts)
 */
export function getHostInfo(speaker: string): HostInfo {
  const host = HOSTS.find((h) => h.name === speaker);

  if (host) {
    return {
      name: host.name,
      image: host.avatar,
      color: host.color,
      bio: host.bio,
    };
  }

  // Default for unknown speakers/guests
  return {
    name: speaker,
    image: '/guest-avatar.svg',
    color: '#6b7280', // gray
  };
}

/**
 * Get all available hosts
 */
export function getAllHosts(): HostInfo[] {
  return HOSTS.map((host) => ({
    name: host.name,
    image: host.avatar,
    color: host.color,
    bio: host.bio,
  }));
}

/**
 * Check if speaker is a known host
 */
export function isKnownHost(speaker: string): boolean {
  return HOSTS.some((host) => host.name === speaker);
}
