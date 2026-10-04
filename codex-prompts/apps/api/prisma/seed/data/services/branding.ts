import { bulletList, doc, heading, l, paragraph } from '../../builders.js';
import { mediaId } from '../media.js';
import { serviceId, type SeedService } from './seed-service.js';

export const branding: SeedService = {
  id: serviceId('branding'),
  slugAr: 'الهوية-التجارية',
  slugEn: 'branding',
  category: 'BRANDING',
  icon: 'palette',
  order: 2,
  status: 'PUBLISHED',
  coverId: mediaId('service-branding'),
  title: l('الهوية التجارية', 'Branding'),
  shortDescription: l(
    'نبني علامات تجارية واضحة ومميزة، من الاستراتيجية والاسم إلى الشعار والهوية البصرية الكاملة.',
    'We build clear, distinctive brands, from strategy and naming to the logo and a complete visual identity.',
  ),
  content: {
    ar: doc(
      heading('علامة تجارية تُعرف من النظرة الأولى'),
      paragraph(
        'الهوية الناجحة تبدأ من سؤال بسيط: لماذا يختارك العميل؟ نساعدك على صياغة إجابة مقنعة، ثم نترجمها إلى شعار وألوان وخطوط وأسلوب تواصل متسق في كل نقطة تواصل مع جمهورك.',
      ),
      bulletList(
        'ورش عمل لفهم جمهورك ومنافسيك',
        'هوية مرنة تعمل على الشاشة والمطبوعات',
        'دليل استخدام يحمي علامتك مع نموها',
      ),
    ),
    en: doc(
      heading('A brand people recognize at a glance'),
      paragraph(
        'A strong identity starts with one question: why should customers choose you? We help you shape a convincing answer, then translate it into a logo, colors, typography and a tone of voice that stay consistent everywhere your audience meets you.',
      ),
      bulletList(
        'Workshops to understand your audience and competitors',
        'A flexible identity for screen and print',
        'Guidelines that protect your brand as it grows',
      ),
    ),
  },
  subServices: [
    {
      title: l('استراتيجية العلامة', 'Brand strategy'),
      description: l(
        'نحدد موقع علامتك وقيمها ورسالتها.',
        'We define your positioning, values and message.',
      ),
    },
    {
      title: l('تصميم الشعار', 'Logo design'),
      description: l(
        'شعار بسيط وقوي يعكس شخصية علامتك.',
        'A simple, strong logo that reflects your personality.',
      ),
    },
    {
      title: l('الهوية البصرية', 'Visual identity'),
      description: l(
        'ألوان وخطوط وعناصر بصرية متناسقة.',
        'Colors, typography and graphic elements that work together.',
      ),
    },
    {
      title: l('دليل الهوية', 'Brand guidelines'),
      description: l(
        'مرجع واضح لاستخدام علامتك بشكل صحيح.',
        'A clear reference for using your brand correctly.',
      ),
    },
    {
      title: l('المطبوعات والتغليف', 'Print and packaging'),
      description: l(
        'تصاميم تنقل هويتك إلى العالم الحقيقي.',
        'Designs that carry your identity into the physical world.',
      ),
    },
  ],
  benefits: [
    {
      title: l('تميّز واضح', 'Clear differentiation'),
      description: l('علامة لا تشبه منافسيك.', 'A brand that stands apart from competitors.'),
    },
    {
      title: l('ثقة أكبر', 'More trust'),
      description: l(
        'الاتساق يبني المصداقية لدى جمهورك.',
        'Consistency builds credibility with your audience.',
      ),
    },
    {
      title: l('توفير في الوقت', 'Time saved'),
      description: l(
        'دليل الهوية يسرّع كل تصميم قادم.',
        'Guidelines speed up every future design.',
      ),
    },
  ],
  faqs: [
    {
      question: l('كم نموذجًا للشعار تقدمون؟', 'How many logo concepts do you present?'),
      answer: l(
        'نقدم عادةً ثلاثة اتجاهات مختلفة، ثم نطوّر الاتجاه الذي تختاره.',
        'Usually three distinct directions; we then refine the one you choose.',
      ),
    },
    {
      question: l('هل يمكن تطوير هوية موجودة؟', 'Can you refresh an existing identity?'),
      answer: l(
        'بالتأكيد، نحافظ على ما يعرفه جمهورك ونطوّر ما يحتاج إلى تحديث.',
        'Absolutely. We keep what your audience knows and modernize what needs it.',
      ),
    },
  ],
};
