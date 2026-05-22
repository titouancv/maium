export interface SocialNetworkInfo {
  name: string;
  handle: string;
  domain: string;
}

interface NetworkDef {
  name: string;
  patterns: RegExp[];
  domain: string;
}

const NETWORKS: NetworkDef[] = [
  { name: "LinkedIn", patterns: [/linkedin\.com\/in\/([^/?#]+)/i], domain: "linkedin.com" },
  {
    name: "X (Twitter)",
    patterns: [/(?:twitter|x)\.com\/(?!home$|search|hashtag|explore|notifications|messages|i\/)([^/?#]+)/i],
    domain: "x.com",
  },
  { name: "Instagram", patterns: [/instagram\.com\/(?!p\/|reel\/|stories\/)([^/?#]+)/i], domain: "instagram.com" },
  { name: "GitHub", patterns: [/github\.com\/(?!orgs\/)([^/?#]+)/i], domain: "github.com" },
  { name: "Facebook", patterns: [/facebook\.com\/(?!groups\/|pages\/)([^/?#]+)/i], domain: "facebook.com" },
  {
    name: "YouTube",
    patterns: [/youtube\.com\/@([^/?#]+)/i, /youtube\.com\/c\/([^/?#]+)/i],
    domain: "youtube.com",
  },
  { name: "TikTok", patterns: [/tiktok\.com\/@([^/?#]+)/i], domain: "tiktok.com" },
  { name: "Twitch", patterns: [/twitch\.tv\/([^/?#]+)/i], domain: "twitch.tv" },
  { name: "Behance", patterns: [/behance\.net\/([^/?#]+)/i], domain: "behance.net" },
  { name: "Dribbble", patterns: [/dribbble\.com\/([^/?#]+)/i], domain: "dribbble.com" },
  { name: "Pinterest", patterns: [/pinterest\.(?:com|fr)\/([^/?#]+)/i], domain: "pinterest.com" },
  { name: "Reddit", patterns: [/reddit\.com\/(?:u|user)\/([^/?#]+)/i], domain: "reddit.com" },
  { name: "Snapchat", patterns: [/snapchat\.com\/add\/([^/?#]+)/i], domain: "snapchat.com" },
];

export function parseSocialUrl(url: string): SocialNetworkInfo | null {
  for (const { name, patterns, domain } of NETWORKS) {
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return { name, handle: match[1].replace(/\/$/, ""), domain };
      }
    }
  }
  return null;
}
