import type { CreateCategoryInput, CreateTagInput } from '@codex/shared';

import { l, seedId } from '../builders.js';

export const categoryId = (slugEn: string): string => seedId(`category:${slugEn}`);
export const tagId = (slugEn: string): string => seedId(`tag:${slugEn}`);

type WithSlugs<T> = T & { id: string; slugAr: string; slugEn: string };

const category = (
  slugEn: string,
  slugAr: string,
  name: CreateCategoryInput['name'],
  type: CreateCategoryInput['type'],
): WithSlugs<CreateCategoryInput> => ({ id: categoryId(slugEn), slugEn, slugAr, name, type });

const tag = (
  slugEn: string,
  slugAr: string,
  name: CreateTagInput['name'],
): WithSlugs<CreateTagInput> => ({
  id: tagId(slugEn),
  slugEn,
  slugAr,
  name,
});

export const CATEGORIES = [
  category('e-commerce', 'التجارة-الإلكترونية', l('التجارة الإلكترونية', 'E-commerce'), 'PROJECT'),
  category(
    'platforms',
    'المنصات-والأنظمة',
    l('المنصات والأنظمة', 'Platforms and systems'),
    'PROJECT',
  ),
  category('brand-identity', 'الهويات-البصرية', l('الهويات البصرية', 'Brand identity'), 'PROJECT'),
  category(
    'campaigns',
    'الحملات-التسويقية',
    l('الحملات التسويقية', 'Marketing campaigns'),
    'PROJECT',
  ),
  category(
    'automation-ai',
    'الأتمتة-والذكاء-الاصطناعي',
    l('الأتمتة والذكاء الاصطناعي', 'Automation and AI'),
    'PROJECT',
  ),
  category('development', 'التطوير', l('التطوير', 'Development'), 'POST'),
  category('branding-insights', 'العلامات-التجارية', l('العلامات التجارية', 'Branding'), 'POST'),
  category('marketing', 'التسويق', l('التسويق', 'Marketing'), 'POST'),
];

export const TAGS = [
  tag('salla', 'سلة', l('سلة', 'Salla')),
  tag('shopify', 'شوبيفاي', l('شوبيفاي', 'Shopify')),
  tag('n8n', 'n8n', l('n8n', 'n8n')),
  tag('ai', 'الذكاء-الاصطناعي', l('الذكاء الاصطناعي', 'AI')),
  tag('seo', 'تحسين-محركات-البحث', l('تحسين محركات البحث', 'SEO')),
  tag('ux', 'تجربة-المستخدم', l('تجربة المستخدم', 'UX')),
  tag('brand-strategy', 'استراتيجية-العلامة', l('استراتيجية العلامة', 'Brand strategy')),
];
