import type { SiteSettingsInput } from '@codex/shared';

import { l } from '../builders.js';
import { mediaId } from './media.js';
import { projectId } from './projects.js';

const QUOTE_PATH = '/quote';

/**
 * PLACEHOLDER contact details and stats: replace the phone, email, address and the four
 * homepage numbers with real values in the admin dashboard before launch.
 */
export const SITE_SETTINGS: SiteSettingsInput = {
  companyName: l('كودكس', 'Codex'),
  logoId: mediaId('site-logo'),
  contact: {
    phone: '+10000000000',
    email: 'hello@example.com',
    address: l('[عنوان الشركة]', '[Company address]'),
  },
  socials: [],
  defaultSeo: {
    metaTitle: l('كودكس | تطوير وهوية وتسويق رقمي', 'Codex | Development, Branding & Marketing'),
    metaDescription: l(
      'وكالة رقمية تبني المتاجر والمنصات والهويات التجارية وتدير حملات التسويق التي تنمّي أعمالك.',
      'A digital agency building stores, platforms and brands, and running marketing that grows your business.',
    ),
  },
  homepage: {
    hero: {
      eyebrow: l('وكالة رقمية متكاملة', 'Full-service digital agency'),
      title: l(
        'نبني علامات تجارية ومنتجات رقمية تنمو معك',
        'We build brands and digital products that grow with you',
      ),
      subtitle: l(
        'فرق متخصصة في التطوير والهوية والتسويق تعمل معًا لتحويل فكرتك إلى نتائج ملموسة.',
        'Dedicated development, branding and marketing teams working together to turn your idea into measurable results.',
      ),
      primaryCta: { label: l('اطلب عرض سعر', 'Get a quote'), href: QUOTE_PATH },
      secondaryCta: { label: l('شاهد أعمالنا', 'See our work'), href: '/portfolio' },
    },
    stats: [
      { value: 120, suffix: '+', label: l('مشروع منجز', 'Projects delivered') },
      { value: 80, suffix: '+', label: l('عميل', 'Clients') },
      { value: 8, label: l('سنوات خبرة', 'Years of experience') },
      { value: 25, label: l('عضوًا في الفريق', 'Team members') },
    ],
    processSteps: [
      {
        title: l('اكتشاف', 'Discover'),
        description: l('نفهم أهدافك وجمهورك وسوقك.', 'We learn your goals, audience and market.'),
      },
      {
        title: l('تصميم', 'Design'),
        description: l(
          'نحوّل الفهم إلى تجربة وهوية واضحة.',
          'We turn insight into a clear experience and identity.',
        ),
      },
      {
        title: l('بناء', 'Build'),
        description: l(
          'نطوّر على مراحل قصيرة مع مراجعات مستمرة.',
          'We build in short iterations with regular reviews.',
        ),
      },
      {
        title: l('إطلاق', 'Launch'),
        description: l(
          'نطلق بثقة بعد اختبار كل التفاصيل.',
          'We launch with confidence after testing every detail.',
        ),
      },
      {
        title: l('نمو', 'Grow'),
        description: l(
          'نقيس ونحسّن باستمرار لنمو مستدام.',
          'We measure and improve for sustainable growth.',
        ),
      },
    ],
    featuredProjectIds: [
      projectId('salla-fashion'),
      projectId('academy-platform'),
      projectId('specialty-cafe'),
      projectId('realestate-launch'),
    ],
    cta: {
      title: l('جاهز لبدء مشروعك القادم؟', 'Ready to start your next project?'),
      subtitle: l(
        'أخبرنا عن فكرتك وسنعود إليك بخطة واضحة خلال يومي عمل.',
        'Tell us about your idea and we will get back with a clear plan within two business days.',
      ),
      button: { label: l('ابدأ الآن', 'Start now'), href: QUOTE_PATH },
    },
  },
};
