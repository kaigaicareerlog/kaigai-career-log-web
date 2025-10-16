/**
 * Host information utilities
 */

export interface HostInfo {
  name: string;
  image: string;
  color: string;
  bio?: string;
}

const HOSTS: Record<string, HostInfo> = {
  Ryo: {
    name: "Ryo",
    image: "/ryo.JPG",
    color: "#3b82f6", // blue
    bio: "Host",
  },
  Senna: {
    name: "Senna",
    image: "/senna.jpg",
    color: "#ec4899", // pink
    bio: "Host",
  },
  Ayaka: {
    name: "Ayaka",
    image: "/ayaka.jpg",
    color: "#8b5cf6", // purple
    bio: "Host",
  },
};

/**
 * Get host information by name
 */
export function getHostInfo(speaker: string): HostInfo {
  return (
    HOSTS[speaker] || {
      name: speaker,
      image: "/guest-avatar.svg",
      color: "#6b7280", // gray
    }
  );
}

/**
 * Get all available hosts
 */
export function getAllHosts(): HostInfo[] {
  return Object.values(HOSTS);
}

/**
 * Check if speaker is a known host
 */
export function isKnownHost(speaker: string): boolean {
  return speaker in HOSTS;
}
