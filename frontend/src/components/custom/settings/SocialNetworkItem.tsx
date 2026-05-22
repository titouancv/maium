import { parseSocialUrl } from "@/lib/socialNetwork";
import { faviconUrl } from "@/lib/utils";

interface Props {
  url: string;
}

export const SocialNetworkItem = ({ url }: Props) => {
  const social = parseSocialUrl(url);
  if (!social) return <span className="text-txt truncate text-sm">{url}</span>;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-txt hover:text-primary transition-colors"
    >
      <div className="flex min-w-0 items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={faviconUrl(social.domain)}
          alt={social.name}
          width={20}
          height={20}
          className="shrink-0"
        />
        <div className="min-w-0">
          <p className="truncate">{social.handle}</p>
        </div>
      </div>
    </a>
  );
};
