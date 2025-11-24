import type { Actor, HostInfo } from '../types';

export const RYO: Actor = {
  name: 'Ryo',
  bio: 'Vancouver在住、Asanaのソフトウェアエンジニア。日本からカナダへ渡り、現在は英語環境でプロダクト開発に携わっています。技術はもちろん、英語力やワークスタイルの改善にも継続的に挑戦中。バレー・テニス・サッカー、そして毎日のストレッチがライフワーク。',
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
    {
      href: 'https://www.linkedin.com/in/senna-goto/',
      icon: 'https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
      title: 'LinkedIn',
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

export const HIROSHI: Actor = {
  name: 'Hiroshi',
  bio: '銀行員・WEBマーケティングを経てバンクーバーへ渡航、現地でWeb/モバイルエンジニアを2年経験。2024年に日本に帰国。現在は楽天で物流系プロダクトマネージャーとして勤務。健康への投資を惜しまない人。',
  avatar: '/hiroshi.jpg',
  color: '#22c55e', // green
  socialLinks: [
    {
      href: 'https://x.com/Isobe_Hiroshi',
      icon: 'https://abs.twimg.com/favicons/twitter.3.ico',
      title: 'X (Twitter)',
    },
    {
      href: 'https://www.linkedin.com/in/hiroshi-isobe/',
      icon: 'https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
      title: 'LinkedIn',
    },
  ],
};

export const HOSTS: Actor[] = [RYO, SENNA, AYAKA, HIROSHI];

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
