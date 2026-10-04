import { useTranslations } from 'next-intl';

import { BudgetRange } from '@codex/shared';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

/** Buttons and every form control, including an invalid field. `id` keeps ids unique. */
export function ShowcaseControls({ id }: { id: string }) {
  const t = useTranslations('showcase');
  const budgets = useTranslations('budgetRanges');

  return (
    <div className="grid gap-10">
      <div>
        <h3 className="mb-4 text-xl">{t('buttons')}</h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button>{t('primary')}</Button>
          <Button variant="secondary">{t('secondary')}</Button>
          <Button variant="outline">{t('outline')}</Button>
          <Button variant="ghost">{t('ghost')}</Button>
          <Button variant="link">{t('link')}</Button>
          <Button isLoading>{t('loading')}</Button>
          <Button size="sm">{t('small')}</Button>
          <Button size="lg">{t('large')}</Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <h3 className="text-xl md:col-span-2">{t('forms')}</h3>
        <FormField id={`${id}-name`} label={t('nameLabel')} error="validation.required">
          {(control) => (
            <Input {...control} placeholder={t('namePlaceholder')} autoComplete="name" />
          )}
        </FormField>
        <FormField id={`${id}-email`} label={t('emailLabel')} hint={t('emailHint')}>
          {(control) => <Input {...control} type="email" autoComplete="email" dir="ltr" />}
        </FormField>
        <FormField id={`${id}-budget`} label={t('budgetLabel')}>
          {(control) => (
            <Select>
              <SelectTrigger {...control}>
                <SelectValue placeholder={t('budgetPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(BudgetRange).map((range) => (
                  <SelectItem key={range} value={range}>
                    {budgets(range)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">{t('timelineLabel')}</legend>
          <RadioGroup defaultValue="soon">
            {(['soon', 'later'] as const).map((value) => (
              <div key={value} className="flex items-center gap-3">
                <RadioGroupItem value={value} id={`${id}-timeline-${value}`} />
                <Label htmlFor={`${id}-timeline-${value}`}>
                  {value === 'soon' ? t('timelineSoon') : t('timelineLater')}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>
        <FormField id={`${id}-message`} label={t('messageLabel')} className="md:col-span-2">
          {(control) => <Textarea {...control} />}
        </FormField>
        <div className="flex items-center gap-3 md:col-span-2">
          <Checkbox id={`${id}-agree`} />
          <Label htmlFor={`${id}-agree`}>{t('agree')}</Label>
        </div>
      </div>
    </div>
  );
}
