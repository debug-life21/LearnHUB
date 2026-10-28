const socialLinks = [
  {
    name: "Facebook",
    url: "https://web.facebook.com/profile.php?id=61589559661444",
    icon: "facebook",
  },
  {
    name: "Twitter",
    url: "https://twitter.com/learnhub",
    icon: "twitter",
  },
  {
    name: "Telegram",
    url: "https://t.me/learnhub",
    icon: "telegram",
  },
  {
    name: "YouTube",
    url: "https://youtube.com/learnhub",
    icon: "youtube",
  },
  { name: "TikTok", url: "https://tiktok.com/@learnhub", icon: "tiktok" },
];

function SocialIcon({ name }) {
  const shared = {
    "aria-hidden": true,
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "facebook":
      return (
        <svg {...shared}>
          <path d="M13.5 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.3v3.2h2.8V21h3.4Z" />
        </svg>
      );
    case "twitter":
      return (
        <svg {...shared}>
          <path d="M23.2 4.6a9.3 9.3 0 0 1-2.7.8 4.7 4.7 0 0 0 2.1-2.6 9.5 9.5 0 0 1-3 1.1 4.7 4.7 0 0 0-8.1 4.3A13.3 13.3 0 0 1 1.8 3.3a4.7 4.7 0 0 0 1.5 6.3 4.6 4.6 0 0 1-2.1-.6v.1a4.7 4.7 0 0 0 3.8 4.6 4.7 4.7 0 0 1-2.1.1 4.7 4.7 0 0 0 4.4 3.3A9.4 9.4 0 0 1 .4 19a13.2 13.2 0 0 0 7.2 2.1c8.7 0 13.4-7.2 13.4-13.4v-.6a9.6 9.6 0 0 0 2.2-2.5Z" />
        </svg>
      );
    case "telegram":
      return (
        <svg {...shared}>
          <path d="M21.8 4.2 18.6 20c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6 13.5l-4.9-1.5c-1.1-.3-1.1-1.1.2-1.6L20.4 3c.9-.3 1.7.2 1.4 1.2Z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...shared}>
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...shared}>
          <path d="M19.6 6.4a6.3 6.3 0 0 1-3.9-1.3v8.4a6.2 6.2 0 1 1-5.4-6.1v3.5a2.8 2.8 0 1 0 1.9 2.6V2h3.5a6.3 6.3 0 0 0 3.9 4.4v.1Z" />
        </svg>
      );
    default:
      return null;
  }
}

export function SocialLinks() {
  return (
    <nav
      aria-label="TedbabeLearnHUB social media"
      className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/90 p-2 shadow-xl shadow-slate-950/20 backdrop-blur-md print:hidden sm:bottom-6 sm:right-6 sm:gap-2 sm:p-2.5"
    >
      {socialLinks.map(({ name, url, icon }) => {
        const className =
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300";
        const content = <SocialIcon name={icon} />;

        return (
          <span
            key={name}
            title={url ? `TedbabeLearnHUB on ${name}` : `${name} link not configured`}
          >
            {url.trim() ? (
              <a
                href={url.trim()}
                target="_blank"
                rel="noreferrer"
                aria-label={`TedbabeLearnHUB on ${name} (opens in a new tab)`}
                className={`${className} hover:bg-white/15`}
              >
                {content}
              </a>
            ) : (
              <span
                aria-label={`${name} link not configured yet`}
                aria-disabled="true"
                className={`${className} cursor-not-allowed text-white/45`}
              >
                {content}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
