import type { CreatePostInput } from '@codex/shared';

import { bulletList, doc, heading, l, paragraph, seedId } from '../builders.js';
import { mediaId } from './media.js';
import { categoryId, tagId } from './taxonomy.js';

export const postId = (key: string): string => seedId(`post:${key}`);

type SeedPost = CreatePostInput & { id: string; slugAr: string; slugEn: string };

const sallaVsShopify: SeedPost = {
  id: postId('salla-vs-shopify'),
  slugAr: 'سلة-أم-شوبيفاي',
  slugEn: 'salla-or-shopify',
  status: 'PUBLISHED',
  publishedAt: '2026-08-04T09:00:00+03:00',
  isFeatured: true,
  coverId: mediaId('post-salla-vs-shopify'),
  categoryIds: [categoryId('development')],
  tagIds: [tagId('salla'), tagId('shopify')],
  title: l(
    'سلة أم شوبيفاي؟ كيف تختار المنصة المناسبة لمتجرك',
    'Salla or Shopify? How to choose the right platform for your store',
  ),
  excerpt: l(
    'مقارنة عملية بين أشهر منصتين للتجارة الإلكترونية في المنطقة، مع أسئلة تساعدك على اتخاذ القرار الصحيح.',
    'A practical comparison of the two most popular e-commerce platforms in the region, with questions to guide your decision.',
  ),
  content: {
    ar: doc(
      paragraph(
        'اختيار منصة المتجر من أهم القرارات في رحلة التجارة الإلكترونية، لأنه يحدد تكلفة التشغيل وسرعة الإطلاق وحدود التوسع لاحقًا. لا توجد منصة أفضل للجميع، بل منصة أنسب لوضعك الحالي وخططك القادمة.',
      ),
      heading('متى تكون سلة الخيار الأنسب؟'),
      paragraph(
        'سلة منصة محلية تفهم السوق جيدًا: واجهة عربية بالكامل، وتكامل جاهز مع بوابات الدفع وشركات الشحن المحلية، ودعم فني بلغتك. إذا كان جمهورك داخل المنطقة وتريد الانطلاق بسرعة وبتكلفة واضحة، فسلة بداية ممتازة.',
      ),
      heading('ومتى تتفوق شوبيفاي؟'),
      paragraph(
        'شوبيفاي تمنحك نظامًا ضخمًا من التطبيقات والثيمات، وقدرة أكبر على البيع لأسواق متعددة بعملات ولغات مختلفة. تناسب العلامات التي تخطط للتوسع عالميًا أو تحتاج إلى تخصيص عميق في تجربة الشراء.',
      ),
      heading('أسئلة تساعدك على القرار'),
      bulletList(
        'أين يقع أغلب عملائك اليوم، وأين تريد أن تبيع بعد عامين؟',
        'ما طرق الدفع والشحن التي لا يمكنك الاستغناء عنها؟',
        'هل تحتاج إلى تكاملات خاصة مع أنظمة داخلية مثل ERP؟',
        'ما الميزانية الشهرية المتاحة للاشتراكات والتطبيقات؟',
      ),
      paragraph(
        'في كودكس نساعدك على الإجابة عن هذه الأسئلة قبل كتابة أي سطر برمجي، ثم نبني المتجر على المنصة التي تخدم أهدافك فعلًا.',
      ),
    ),
    en: doc(
      paragraph(
        'Choosing a store platform is one of the most important decisions in e-commerce: it shapes running costs, launch speed and how far you can grow. There is no best platform for everyone, only the one that fits where you are and where you are going.',
      ),
      heading('When is Salla the better fit?'),
      paragraph(
        'Salla is a local platform that understands the market: a fully Arabic interface, ready integrations with regional payment gateways and carriers, and support in your language. If your customers are in the region and you want to launch quickly at a predictable cost, Salla is an excellent start.',
      ),
      heading('And when does Shopify win?'),
      paragraph(
        'Shopify gives you a huge ecosystem of apps and themes and makes it easier to sell across markets, currencies and languages. It suits brands planning to expand internationally or needing deep customization of the buying experience.',
      ),
      heading('Questions that help you decide'),
      bulletList(
        'Where are most of your customers today, and where do you want to sell in two years?',
        'Which payment and shipping methods can you not live without?',
        'Do you need custom integrations with internal systems such as an ERP?',
        'What monthly budget can you allocate to subscriptions and apps?',
      ),
      paragraph(
        'At Codex we help you answer these questions before writing a single line of code, then build your store on the platform that truly serves your goals.',
      ),
    ),
  },
};

const brandBeyondLogo: SeedPost = {
  id: postId('brand-beyond-logo'),
  slugAr: 'الهوية-أكبر-من-شعار',
  slugEn: 'brand-identity-beyond-the-logo',
  status: 'PUBLISHED',
  publishedAt: '2026-08-21T09:00:00+03:00',
  isFeatured: false,
  coverId: mediaId('post-brand-beyond-logo'),
  categoryIds: [categoryId('branding-insights')],
  tagIds: [tagId('brand-strategy'), tagId('ux')],
  title: l('الهوية البصرية أكبر من مجرد شعار', 'Brand identity is more than a logo'),
  excerpt: l(
    'الشعار هو الواجهة فقط. تعرّف على العناصر التي تصنع علامة تجارية متماسكة يتذكرها عملاؤك.',
    'The logo is only the front door. Discover the elements that make a cohesive brand your customers remember.',
  ),
  content: {
    ar: doc(
      paragraph(
        'يعتقد كثيرون أن بناء العلامة التجارية ينتهي عند تصميم الشعار، لكن الشعار مجرد جزء صغير من صورة أكبر يراها العميل في كل تفاعل مع علامتك.',
      ),
      heading('ما الذي تتكون منه الهوية؟'),
      bulletList(
        'الاستراتيجية: من أنت، ولمن تتحدث، ولماذا يختارك الناس',
        'العناصر البصرية: الألوان والخطوط والصور والأيقونات',
        'نبرة الصوت: طريقة كتابتك وحديثك مع جمهورك',
        'التجربة: شكل موقعك وتغليفك وخدمة عملائك',
      ),
      heading('لماذا يهم الاتساق؟'),
      paragraph(
        'عندما يرى العميل العلامة نفسها بالأسلوب نفسه في كل مكان، تتحول الألفة إلى ثقة، والثقة إلى قرار شراء. لهذا نسلّم مع كل هوية دليل استخدام واضحًا يضمن بقاءها متماسكة مهما كبر فريقك.',
      ),
    ),
    en: doc(
      paragraph(
        'Many people think building a brand ends with the logo, but the logo is only a small part of a bigger picture customers see in every interaction with you.',
      ),
      heading('What makes up an identity?'),
      bulletList(
        'Strategy: who you are, who you speak to and why people choose you',
        'Visual elements: colors, typography, imagery and icons',
        'Tone of voice: how you write and talk to your audience',
        'Experience: your website, packaging and customer service',
      ),
      heading('Why consistency matters'),
      paragraph(
        'When customers see the same brand in the same style everywhere, familiarity turns into trust, and trust into a purchase. That is why every identity we deliver comes with clear guidelines that keep it cohesive as your team grows.',
      ),
    ),
  },
};

const n8nAutomation: SeedPost = {
  id: postId('n8n-ai-automation'),
  slugAr: 'الأتمتة-بـ-n8n-والذكاء-الاصطناعي',
  slugEn: 'automation-with-n8n-and-ai-agents',
  status: 'PUBLISHED',
  publishedAt: '2026-09-08T09:00:00+03:00',
  isFeatured: false,
  coverId: mediaId('post-n8n-ai-automation'),
  categoryIds: [categoryId('development')],
  tagIds: [tagId('n8n'), tagId('ai')],
  title: l(
    'أتمتة العمليات بـ n8n ووكلاء الذكاء الاصطناعي: من أين تبدأ؟',
    'Automating operations with n8n and AI agents: where to start',
  ),
  excerpt: l(
    'خطوات عملية لاكتشاف المهام التي تستحق الأتمتة، وكيف تجمع بين n8n والذكاء الاصطناعي دون تعقيد.',
    'Practical steps to find the tasks worth automating, and how to combine n8n with AI without the complexity.',
  ),
  content: {
    ar: doc(
      paragraph(
        'يقضي فريقك ساعات أسبوعيًا في نسخ البيانات بين الأنظمة والرد على الأسئلة نفسها وإعداد التقارير يدويًا. هذه المهام مرشحة مثالية للأتمتة.',
      ),
      heading('ابدأ بخريطة للمهام المتكررة'),
      paragraph(
        'اكتب كل مهمة تتكرر يوميًا أو أسبوعيًا، وقدّر الوقت الذي تستغرقه ومدى تعرضها للأخطاء. ابدأ بالمهمة الأكثر تكرارًا والأقل تعقيدًا لتحقق نتيجة سريعة.',
      ),
      heading('دور n8n'),
      paragraph(
        'n8n أداة مفتوحة المصدر تربط مئات التطبيقات عبر تدفقات مرئية: طلب جديد في المتجر ينشئ فاتورة، ويحدّث المخزون، ويرسل رسالة للعميل، دون تدخل يدوي.',
      ),
      heading('وأين يدخل الذكاء الاصطناعي؟'),
      bulletList(
        'تصنيف الرسائل الواردة وتوجيهها للقسم المناسب',
        'تلخيص المحادثات الطويلة واستخراج المطلوب منها',
        'الرد على الأسئلة الشائعة بالاعتماد على معلومات شركتك',
      ),
      paragraph(
        'الأهم أن تبقى القرارات الحساسة بيد فريقك، وأن تُقاس كل أتمتة بالوقت الذي توفره فعلًا.',
      ),
    ),
    en: doc(
      paragraph(
        'Your team spends hours every week copying data between systems, answering the same questions and building reports by hand. These tasks are ideal candidates for automation.',
      ),
      heading('Start with a map of repetitive work'),
      paragraph(
        'List every task that repeats daily or weekly, estimate the time it takes and how error-prone it is. Start with the most frequent, least complex task to get a quick win.',
      ),
      heading('Where n8n fits'),
      paragraph(
        'n8n is an open-source tool that connects hundreds of apps through visual workflows: a new store order creates an invoice, updates stock and messages the customer, with no manual step.',
      ),
      heading('And where does AI come in?'),
      bulletList(
        'Classifying incoming messages and routing them to the right team',
        'Summarizing long conversations and extracting what is needed',
        'Answering common questions using your company knowledge',
      ),
      paragraph(
        'Most importantly, keep sensitive decisions with your team, and measure every automation by the time it actually saves.',
      ),
    ),
  },
};

export const POSTS: SeedPost[] = [sallaVsShopify, brandBeyondLogo, n8nAutomation];
