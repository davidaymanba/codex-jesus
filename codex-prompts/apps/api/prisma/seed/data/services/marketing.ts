import { bulletList, doc, heading, l, paragraph } from '../../builders.js';
import { mediaId } from '../media.js';
import { serviceId, type SeedService } from './seed-service.js';

export const marketing: SeedService = {
  id: serviceId('marketing'),
  slugAr: 'التسويق-الرقمي',
  slugEn: 'digital-marketing',
  category: 'MARKETING',
  icon: 'megaphone',
  order: 3,
  status: 'PUBLISHED',
  coverId: mediaId('service-marketing'),
  title: l('التسويق الرقمي', 'Digital Marketing'),
  shortDescription: l(
    'نصل بعلامتك إلى الجمهور المناسب عبر محتوى مؤثر وإعلانات مدروسة وتحسين مستمر مبني على البيانات.',
    'We bring your brand to the right audience with compelling content, targeted ads and data-driven optimization.',
  ),
  content: {
    ar: doc(
      heading('تسويق يُقاس بالنتائج'),
      paragraph(
        'نضع خطة واضحة الأهداف، ونختار القنوات التي يتواجد فيها عملاؤك فعلًا، ثم نتابع الأرقام أسبوعيًا ونعدّل الحملات لتحقيق أفضل عائد على ميزانيتك.',
      ),
      bulletList(
        'خطة محتوى شهرية بهوية علامتك',
        'حملات مدفوعة على المنصات المناسبة',
        'تقارير واضحة تركّز على ما يهم',
      ),
    ),
    en: doc(
      heading('Marketing measured by results'),
      paragraph(
        'We set a plan with clear goals, pick the channels where your customers actually are, then review the numbers every week and adjust campaigns to get the best return on your budget.',
      ),
      bulletList(
        'A monthly content plan in your brand voice',
        'Paid campaigns on the right platforms',
        'Clear reports focused on what matters',
      ),
    ),
  },
  subServices: [
    {
      title: l('إدارة وسائل التواصل', 'Social media management'),
      description: l(
        'حضور منتظم وتفاعل حقيقي مع جمهورك.',
        'Consistent presence and real engagement.',
      ),
    },
    {
      title: l('صناعة المحتوى', 'Content creation'),
      description: l(
        'تصاميم وفيديوهات ونصوص تجذب الانتباه.',
        'Designs, videos and copy that capture attention.',
      ),
    },
    {
      title: l('الإعلانات المدفوعة', 'Paid advertising'),
      description: l(
        'حملات مستهدفة بميزانية تحت السيطرة.',
        'Targeted campaigns with a controlled budget.',
      ),
    },
    {
      title: l('تحسين محركات البحث', 'SEO'),
      description: l(
        'ظهور أعلى في نتائج البحث وزيارات مستمرة.',
        'Higher rankings and steady organic traffic.',
      ),
    },
    {
      title: l('التحليلات والتقارير', 'Analytics and reporting'),
      description: l('قرارات مبنية على بيانات دقيقة.', 'Decisions backed by accurate data.'),
    },
  ],
  benefits: [
    {
      title: l('جمهور أدق', 'Sharper targeting'),
      description: l(
        'نصل إلى من يهتم فعلًا بما تقدمه.',
        'We reach people who actually care about your offer.',
      ),
    },
    {
      title: l('إنفاق أذكى', 'Smarter spend'),
      description: l(
        'نوقف ما لا ينجح ونضاعف ما ينجح.',
        'We cut what does not work and scale what does.',
      ),
    },
    {
      title: l('شفافية كاملة', 'Full transparency'),
      description: l('ترى كل رقم وكل قرار.', 'You see every number and every decision.'),
    },
  ],
  faqs: [
    {
      question: l('متى تظهر نتائج الحملات؟', 'When do campaigns show results?'),
      answer: l(
        'تظهر مؤشرات الإعلانات خلال الأسابيع الأولى، بينما يحتاج تحسين محركات البحث عادةً من ثلاثة إلى ستة أشهر.',
        'Ad signals appear within the first weeks; SEO usually needs three to six months.',
      ),
    },
    {
      question: l('هل تديرون الحسابات بأسماء عملائنا؟', 'Are ad accounts owned by us?'),
      answer: l(
        'نعم، الحسابات والبيانات ملكك دائمًا ونحن نديرها بصلاحيات محددة.',
        'Yes. Accounts and data are always yours; we manage them with scoped access.',
      ),
    },
  ],
};
