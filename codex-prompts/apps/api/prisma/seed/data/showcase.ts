import type {
  CreateClientInput,
  CreateTeamMemberInput,
  CreateTestimonialInput,
  LocalizedString,
} from '@codex/shared';

import { l, seedId } from '../builders.js';
import { mediaId } from './media.js';

type WithId<T> = T & { id: string };

const testimonial = (
  key: string,
  role: LocalizedString,
  quote: LocalizedString,
  rating: number,
  order: number,
): WithId<CreateTestimonialInput> => ({
  id: seedId(`testimonial:${key}`),
  clientName: '[Client Name]',
  company: '[Company Name]',
  role,
  quote,
  rating,
  order,
  isVisible: true,
});

/** PLACEHOLDER testimonials: replace with real, approved client quotes before launch. */
export const TESTIMONIALS = [
  testimonial(
    'store-owner',
    l('مؤسس متجر إلكتروني', 'Founder, online store'),
    l(
      'فهم فريق كودكس احتياجنا من أول اجتماع، وسلّم المتجر في الموعد مع اهتمام واضح بأدق التفاصيل.',
      'The Codex team understood what we needed from the first meeting and delivered the store on time, with real attention to detail.',
    ),
    5,
    1,
  ),
  testimonial(
    'marketing-director',
    l('مديرة التسويق', 'Marketing Director'),
    l(
      'الحملة تجاوزت أهدافنا، والأهم أننا كنا نفهم كل رقم في التقارير الأسبوعية.',
      'The campaign beat our targets, and more importantly we understood every number in the weekly reports.',
    ),
    5,
    2,
  ),
  testimonial(
    'cafe-founder',
    l('شريك مؤسس', 'Co-founder'),
    l(
      'الهوية الجديدة غيّرت نظرة العملاء لنا تمامًا، وأصبح الناس يتعرفون على علامتنا قبل قراءة الاسم.',
      'The new identity completely changed how customers see us; people now recognize our brand before reading the name.',
    ),
    5,
    3,
  ),
  testimonial(
    'operations-manager',
    l('مدير العمليات', 'Operations Manager'),
    l(
      'الأتمتة وفّرت على فريقنا ساعات كل أسبوع، والتواصل مع كودكس كان سلسًا طوال المشروع.',
      'The automation saves our team hours every week, and working with Codex was smooth throughout the project.',
    ),
    4,
    4,
  ),
];

const member = (
  index: number,
  team: CreateTeamMemberInput['team'],
  role: LocalizedString,
  bio: LocalizedString,
): WithId<CreateTeamMemberInput> => ({
  id: seedId(`team-member:${index}`),
  name: l(`[اسم عضو الفريق ${index}]`, `[Team Member ${index}]`),
  role,
  team,
  bio,
  photoId: mediaId(`team-${index}`),
  socials: [],
  order: index,
  isVisible: true,
});

/** PLACEHOLDER team: names, photos and bios must come from the real team. */
export const TEAM_MEMBERS = [
  member(
    1,
    'BRAND',
    l('استراتيجي العلامات التجارية', 'Brand Strategist'),
    l(
      'يقود ورش الاستراتيجية ويحوّل أفكار العملاء إلى علامات واضحة.',
      'Leads strategy workshops and turns client ideas into clear brands.',
    ),
  ),
  member(
    2,
    'BRAND',
    l('مصممة هويات بصرية أولى', 'Senior Identity Designer'),
    l('تصمم شعارات وأنظمة بصرية تعيش طويلًا.', 'Designs logos and visual systems built to last.'),
  ),
  member(
    3,
    'MARKETING',
    l('قائد فريق التسويق', 'Marketing Lead'),
    l(
      'يخطط الحملات ويتابع أداءها بالأرقام.',
      'Plans campaigns and tracks their performance by the numbers.',
    ),
  ),
  member(
    4,
    'MARKETING',
    l('صانعة محتوى', 'Content Strategist'),
    l(
      'تكتب محتوى يشبه العلامة ويتحدث بلغة جمهورها.',
      'Writes content that sounds like the brand and speaks its audience’s language.',
    ),
  ),
  member(
    5,
    'DEVELOPMENT',
    l('القائد التقني', 'Tech Lead'),
    l(
      'يصمم بنية الأنظمة ويضمن جودة الكود وأمانه.',
      'Designs system architecture and safeguards code quality and security.',
    ),
  ),
  member(
    6,
    'DEVELOPMENT',
    l('مطورة برمجيات متكاملة', 'Full-Stack Engineer'),
    l(
      'تبني واجهات سريعة وخدمات خلفية موثوقة.',
      'Builds fast interfaces and reliable back-end services.',
    ),
  ),
];

/** PLACEHOLDER clients: real names and logos are added once client permission is confirmed. */
export const CLIENTS: WithId<CreateClientInput>[] = Array.from({ length: 8 }, (_, offset) => {
  const index = offset + 1;
  return {
    id: seedId(`client:${index}`),
    name: `[Client Name ${index}]`,
    logoId: mediaId(`client-${index}`),
    website: null,
    order: index,
    isVisible: true,
  };
});
