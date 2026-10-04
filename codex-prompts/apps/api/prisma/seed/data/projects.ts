import type { CreateProjectInput, LocalizedString } from '@codex/shared';

import { doc, l, paragraph, seedId } from '../builders.js';
import { mediaId } from './media.js';
import { categoryId } from './taxonomy.js';

export const projectId = (key: string): string => seedId(`project:${key}`);

type SeedProject = CreateProjectInput & { id: string; slugAr: string; slugEn: string };

interface ProjectSpec {
  key: string;
  slugAr: string;
  slugEn: string;
  order: number;
  isFeatured: boolean;
  publishedAt: string;
  serviceCategory: CreateProjectInput['serviceCategory'];
  category: string;
  title: LocalizedString;
  industry: LocalizedString;
  challenge: LocalizedString;
  solution: LocalizedString;
  /** PLACEHOLDER metrics: bracketed values must be replaced with the client's real numbers. */
  results: CreateProjectInput['results'];
  techStack: string[];
}

const toProject = (spec: ProjectSpec): SeedProject => ({
  id: projectId(spec.key),
  slugAr: spec.slugAr,
  slugEn: spec.slugEn,
  title: spec.title,
  client: '[Client Name]',
  industry: spec.industry,
  serviceCategory: spec.serviceCategory,
  coverId: mediaId(`project-${spec.key}`),
  galleryIds: [mediaId(`project-${spec.key}-gallery-1`), mediaId(`project-${spec.key}-gallery-2`)],
  challenge: { ar: doc(paragraph(spec.challenge.ar)), en: doc(paragraph(spec.challenge.en)) },
  solution: { ar: doc(paragraph(spec.solution.ar)), en: doc(paragraph(spec.solution.en)) },
  results: spec.results,
  techStack: spec.techStack,
  categoryIds: [categoryId(spec.category)],
  isFeatured: spec.isFeatured,
  status: 'PUBLISHED',
  publishedAt: spec.publishedAt,
  order: spec.order,
});

const result = (metricAr: string, metricEn: string, value: string) => ({
  metric: l(metricAr, metricEn),
  value: l(value, value),
});

const SPECS: ProjectSpec[] = [
  {
    key: 'salla-fashion',
    slugAr: 'متجر-أزياء-على-سلة',
    slugEn: 'salla-fashion-store',
    order: 1,
    isFeatured: true,
    publishedAt: '2026-03-10T09:00:00+03:00',
    serviceCategory: 'DEVELOPMENT',
    category: 'e-commerce',
    title: l('متجر أزياء متكامل على سلة', 'A complete fashion store on Salla'),
    industry: l('تجارة الأزياء', 'Fashion retail'),
    challenge: l(
      'كان العميل يبيع عبر حسابات التواصل الاجتماعي فقط، مع طلبات تُدار يدويًا وتجربة شراء متقطعة تُفقده جزءًا كبيرًا من العملاء.',
      'The client sold only through social media, handled orders by hand and lost many customers to a fragmented buying experience.',
    ),
    solution: l(
      'صممنا ثيمًا مخصصًا على سلة يعكس هوية العلامة، وربطنا المتجر بشركات الشحن وبوابات الدفع، وأضفنا صفحات منتجات سريعة مع مقاسات وتوصيات ذكية.',
      'We designed a custom Salla theme in the brand style, connected shipping carriers and payment gateways, and built fast product pages with size guides and smart recommendations.',
    ),
    results: [
      result('معدل التحويل', 'Conversion rate', '[+00%]'),
      result('الطلبات الشهرية', 'Monthly orders', '[0×]'),
    ],
    techStack: ['Salla', 'Twig', 'JavaScript'],
  },
  {
    key: 'academy-platform',
    slugAr: 'منصة-تعليمية-لأكاديمية-تدريب',
    slugEn: 'training-academy-platform',
    order: 2,
    isFeatured: true,
    publishedAt: '2026-04-02T09:00:00+03:00',
    serviceCategory: 'DEVELOPMENT',
    category: 'platforms',
    title: l('منصة تعليمية لأكاديمية تدريب', 'A learning platform for a training academy'),
    industry: l('التعليم والتدريب', 'Education and training'),
    challenge: l(
      'احتاجت الأكاديمية إلى نقل دوراتها الحضورية إلى الإنترنت دون أن تفقد التفاعل بين المدربين والمتدربين، مع إصدار شهادات موثقة.',
      'The academy needed to move in-person courses online without losing trainer interaction, and to issue verifiable certificates.',
    ),
    solution: l(
      'بنينا منصة تضم مسارات تعليمية ودروسًا مسجلة وجلسات مباشرة واختبارات تلقائية، مع لوحة تحكم للمدربين وشهادات يمكن التحقق منها برابط.',
      'We built a platform with learning paths, recorded lessons, live sessions and auto-graded quizzes, plus a trainer dashboard and certificates verifiable by link.',
    ),
    results: [
      result('المتدربون النشطون', 'Active learners', '[0,000]'),
      result('نسبة إكمال الدورات', 'Course completion', '[00%]'),
    ],
    techStack: ['Next.js', 'Node.js', 'PostgreSQL'],
  },
  {
    key: 'distribution-erp',
    slugAr: 'نظام-erp-لشركة-توزيع',
    slugEn: 'distribution-erp-crm',
    order: 3,
    isFeatured: false,
    publishedAt: '2026-05-18T09:00:00+03:00',
    serviceCategory: 'DEVELOPMENT',
    category: 'platforms',
    title: l('نظام ERP وCRM لشركة توزيع', 'ERP and CRM for a distribution company'),
    industry: l('التوزيع والإمداد', 'Distribution and logistics'),
    challenge: l(
      'تعددت الجداول والأنظمة بين المبيعات والمخازن والحسابات، فتأخرت التقارير وتكررت الأخطاء في الطلبات والمخزون.',
      'Sales, warehouse and accounting each used separate spreadsheets and tools, delaying reports and causing order and stock errors.',
    ),
    solution: l(
      'وحّدنا العمليات في نظام واحد يربط المبيعات بالمخزون والفوترة، مع تطبيق لمندوبي المبيعات ولوحات متابعة لحظية للإدارة.',
      'We unified operations in one system linking sales, inventory and invoicing, with a field-sales app and real-time dashboards for management.',
    ),
    results: [
      result('وقت إعداد التقارير', 'Reporting time', '[-00%]'),
      result('أخطاء المخزون', 'Stock errors', '[-00%]'),
    ],
    techStack: ['React', 'Node.js', 'PostgreSQL', 'Redis'],
  },
  {
    key: 'specialty-cafe',
    slugAr: 'هوية-بصرية-لمقهى-مختص',
    slugEn: 'specialty-cafe-identity',
    order: 4,
    isFeatured: true,
    publishedAt: '2026-02-14T09:00:00+03:00',
    serviceCategory: 'BRANDING',
    category: 'brand-identity',
    title: l('هوية بصرية لمقهى مختص', 'Visual identity for a specialty café'),
    industry: l('الضيافة والمقاهي', 'Hospitality'),
    challenge: l(
      'أراد المقهى أن يتميز في سوق مزدحم بعلامة دافئة وعصرية تناسب جمهورًا شابًا وتبقى واضحة على الأكواب واللافتات والتطبيقات.',
      'The café wanted to stand out in a crowded market with a warm, modern brand for a young audience that stays legible on cups, signage and apps.',
    ),
    solution: l(
      'طورنا اسمًا ورسالة وشعارًا مرنًا بنسختين عربية ولاتينية، ولوحة ألوان مستوحاة من مراحل تحميص البن، ودليل هوية شاملًا للتغليف والمساحات.',
      'We developed the naming, message and a flexible bilingual logo, a palette inspired by coffee roasting stages, and full guidelines for packaging and interiors.',
    ),
    results: [
      result('الفروع المفتتحة', 'Branches opened', '[0]'),
      result('المتابعون خلال ٣ أشهر', 'Followers in 3 months', '[00K]'),
    ],
    techStack: ['Adobe Illustrator', 'Figma'],
  },
  {
    key: 'realestate-launch',
    slugAr: 'حملة-إطلاق-مشروع-سكني',
    slugEn: 'residential-launch-campaign',
    order: 5,
    isFeatured: true,
    publishedAt: '2026-06-05T09:00:00+03:00',
    serviceCategory: 'MARKETING',
    category: 'campaigns',
    title: l('حملة إطلاق مشروع سكني', 'Launch campaign for a residential project'),
    industry: l('التطوير العقاري', 'Real estate'),
    challenge: l(
      'كان على المطوّر بيع المرحلة الأولى خلال فترة قصيرة، مع منافسة قوية وتكلفة مرتفعة للعميل المحتمل في القنوات التقليدية.',
      'The developer had to sell the first phase quickly, facing strong competition and a high cost per lead on traditional channels.',
    ),
    solution: l(
      'أطلقنا حملة متعددة القنوات بمحتوى مرئي يبرز نمط الحياة، وصفحات هبوط سريعة، واستهداف دقيق، مع ربط العملاء المحتملين مباشرة بفريق المبيعات.',
      'We ran a multi-channel campaign with lifestyle-led visuals, fast landing pages and precise targeting, routing leads straight to the sales team.',
    ),
    results: [
      result('العملاء المحتملون', 'Qualified leads', '[0,000]'),
      result('تكلفة العميل المحتمل', 'Cost per lead', '[-00%]'),
    ],
    techStack: ['Meta Ads', 'Google Ads', 'Google Analytics 4'],
  },
  {
    key: 'ai-support',
    slugAr: 'وكيل-ذكاء-اصطناعي-لخدمة-العملاء',
    slugEn: 'ai-customer-support-agent',
    order: 6,
    isFeatured: false,
    publishedAt: '2026-07-20T09:00:00+03:00',
    serviceCategory: 'DEVELOPMENT',
    category: 'automation-ai',
    title: l('وكيل ذكاء اصطناعي لخدمة العملاء', 'AI customer support agent'),
    industry: l('التجارة الإلكترونية', 'E-commerce'),
    challenge: l(
      'تضاعفت استفسارات العملاء في المواسم، وكان الفريق يقضي معظم وقته في أسئلة متكررة عن حالة الطلب والاسترجاع.',
      'Customer questions doubled in peak seasons, and the team spent most of its time on repetitive order-status and returns questions.',
    ),
    solution: l(
      'بنينا وكيلًا ذكيًا يجيب بالعربية والإنجليزية عبر واتساب والموقع، ويستعلم عن الطلبات مباشرة، مع تدفقات n8n تحوّل الحالات المعقدة إلى الفريق.',
      'We built an agent that answers in Arabic and English on WhatsApp and the website, looks up orders directly, and uses n8n flows to hand complex cases to the team.',
    ),
    results: [
      result('الاستفسارات المحلولة تلقائيًا', 'Queries resolved automatically', '[00%]'),
      result('زمن الرد', 'Response time', '[-00%]'),
    ],
    techStack: ['n8n', 'LLM APIs', 'WhatsApp Business API', 'Shopify'],
  },
];

export const PROJECTS: SeedProject[] = SPECS.map(toProject);
