import { bulletList, doc, heading, l, paragraph } from '../../builders.js';
import { mediaId } from '../media.js';
import { serviceId, type SeedService } from './seed-service.js';

export const development: SeedService = {
  id: serviceId('development'),
  slugAr: 'تطوير-البرمجيات',
  slugEn: 'software-development',
  category: 'DEVELOPMENT',
  icon: 'code-xml',
  order: 1,
  status: 'PUBLISHED',
  coverId: mediaId('service-development'),
  title: l('تطوير البرمجيات', 'Software Development'),
  shortDescription: l(
    'نصمّم ونبني منتجات رقمية سريعة وآمنة وقابلة للنمو، من المتاجر الإلكترونية إلى الأنظمة المؤسسية ووكلاء الذكاء الاصطناعي.',
    'We design and build fast, secure and scalable digital products, from online stores to enterprise systems and AI agents.',
  ),
  content: {
    ar: doc(
      heading('برمجيات تخدم أهداف عملك'),
      paragraph(
        'نبدأ بفهم طريقة عملك وعملائك، ثم نختار التقنية المناسبة بدل أن نفرض حلًا جاهزًا. كل مشروع يمر بمراحل واضحة: تحليل، وتصميم تجربة المستخدم، وتطوير على دفعات قصيرة، واختبار، ثم إطلاق ومتابعة.',
      ),
      bulletList(
        'كود نظيف وموثّق يسهل تطويره لاحقًا',
        'أداء عالٍ وأمان مدمج منذ اليوم الأول',
        'دعم فني وتحسينات مستمرة بعد الإطلاق',
      ),
    ),
    en: doc(
      heading('Software that serves your business goals'),
      paragraph(
        'We start by understanding how your business and customers work, then choose the right technology instead of forcing an off-the-shelf answer. Every project follows clear stages: discovery, UX design, iterative development, testing, launch and ongoing support.',
      ),
      bulletList(
        'Clean, documented code that is easy to extend',
        'High performance and security built in from day one',
        'Support and continuous improvement after launch',
      ),
    ),
  },
  subServices: [
    {
      title: l('المتاجر الإلكترونية', 'E-commerce'),
      description: l(
        'متاجر سريعة وآمنة مصممة لرفع معدلات الشراء.',
        'Fast, secure stores built to convert.',
      ),
    },
    {
      title: l('المنصات التعليمية', 'E-learning platforms'),
      description: l(
        'منصات تعلّم عن بُعد لإدارة الدورات والطلاب والاختبارات.',
        'Online learning with course, student and assessment management.',
      ),
    },
    {
      title: l('أنظمة ERP', 'ERP systems'),
      description: l(
        'نربط المالية والمخزون والمشتريات في نظام واحد.',
        'Finance, inventory and procurement in one connected system.',
      ),
    },
    {
      title: l('أنظمة CRM', 'CRM systems'),
      description: l(
        'تابع العملاء المحتملين والصفقات وخدمة العملاء من مكان واحد.',
        'Track leads, deals and customer service in one place.',
      ),
    },
    {
      title: l('متاجر سلة', 'Salla stores'),
      description: l(
        'أطلق متجرك على سلة بتصميم مخصص وتكاملات جاهزة.',
        'Launch on Salla with a custom theme and ready integrations.',
      ),
    },
    {
      title: l('متاجر شوبيفاي', 'Shopify stores'),
      description: l(
        'ثيمات وتطبيقات مخصصة لتجارة تكبر معك.',
        'Custom themes and apps for commerce that scales with you.',
      ),
    },
    {
      title: l('مواقع ووردبريس', 'WordPress'),
      description: l(
        'مواقع سهلة الإدارة وسريعة ومهيأة لمحركات البحث.',
        'Easy-to-manage, fast, search-ready websites.',
      ),
    },
    {
      title: l('وكلاء الذكاء الاصطناعي', 'AI agents'),
      description: l(
        'مساعدون أذكياء يردّون على عملائك وينجزون المهام على مدار الساعة.',
        'Smart assistants that answer customers and get work done around the clock.',
      ),
    },
    {
      title: l('الأتمتة عبر n8n', 'n8n automation'),
      description: l(
        'نربط أدواتك ونؤتمت المهام المتكررة ليتفرغ فريقك لما يهم.',
        'We connect your tools and automate repetitive work so your team can focus.',
      ),
    },
  ],
  benefits: [
    {
      title: l('سرعة في الإطلاق', 'Faster launch'),
      description: l(
        'نسلّم على مراحل لترى النتائج مبكرًا.',
        'We deliver in stages so you see results early.',
      ),
    },
    {
      title: l('أمان من البداية', 'Secure by default'),
      description: l(
        'نطبّق أفضل ممارسات الحماية في كل طبقة.',
        'Security best practices at every layer.',
      ),
    },
    {
      title: l('جاهزية للنمو', 'Ready to scale'),
      description: l(
        'بنية تتحمل زيادة المستخدمين والبيانات.',
        'Architecture that handles growing users and data.',
      ),
    },
  ],
  faqs: [
    {
      question: l('كم يستغرق تطوير متجر إلكتروني؟', 'How long does an online store take?'),
      answer: l(
        'غالبًا بين أربعة وثمانية أسابيع حسب عدد المنتجات والتكاملات المطلوبة.',
        'Usually four to eight weeks, depending on catalog size and integrations.',
      ),
    },
    {
      question: l('هل تقدمون الدعم بعد الإطلاق؟', 'Do you offer support after launch?'),
      answer: l(
        'نعم، نوفر باقات دعم وصيانة شهرية تشمل التحديثات والتحسينات.',
        'Yes. Monthly support plans cover updates and improvements.',
      ),
    },
  ],
};
