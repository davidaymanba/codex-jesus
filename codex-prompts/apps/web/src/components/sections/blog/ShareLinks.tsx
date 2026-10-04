import { Mail, Share2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

interface ShareLinksProps {
  url: string;
  title: string;
}

const linkClasses =
  'inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:border-primary hover:text-primary';

/** Plain share URLs: no third-party script, widget or tracking pixel loads on the page. */
export async function ShareLinks({ url, title }: ShareLinksProps) {
  const t = await getTranslations('blog.post');
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const networks = [
    { name: 'X', href: `https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}` },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { name: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  ];

  return (
    <section aria-labelledby="share-title" className="flex flex-col gap-4">
      <h2 id="share-title" className="flex items-center gap-2 font-sans text-base font-medium">
        <Share2 aria-hidden className="size-4" />
        {t('share')}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {networks.map(({ name, href }) => (
          <li key={name}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('shareOn', { network: name })}
              className={linkClasses}
            >
              {name}
            </a>
          </li>
        ))}
        <li>
          <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`} className={linkClasses}>
            <Mail aria-hidden className="size-4" />
            {t('email')}
          </a>
        </li>
      </ul>
    </section>
  );
}
