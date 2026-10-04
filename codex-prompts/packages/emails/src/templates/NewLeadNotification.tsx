import {
  DEFAULT_LOCALE,
  type BudgetRange,
  type Locale,
  type ProjectTimeline,
  type ServiceOffering,
} from '@codex/shared';

import { EmailLayout } from '../components/EmailLayout.js';
import { EmailHeading, Field, Paragraph, PrimaryButton } from '../components/parts.js';
import { messagesFor } from '../messages/index.js';

interface LeadContact {
  name: string;
  email: string;
  phone?: string | undefined;
  company?: string | undefined;
}

export type NewLeadNotificationProps = LeadContact & {
  /** The company inbox's language. */
  locale: Locale;
  /** Link to the lead in the admin dashboard. */
  adminUrl: string;
} & (
    | {
        kind: 'quote';
        services: ServiceOffering[];
        budgetRange: BudgetRange;
        timeline: ProjectTimeline;
        projectDetails: string;
      }
    | { kind: 'contact'; message: string }
  );

/** To the company: a new quote request or contact message, with a link to the admin. */
export function NewLeadNotification(props: NewLeadNotificationProps) {
  const copy = messagesFor(props.locale);
  const heading = props.kind === 'quote' ? copy.newLead.quoteHeading : copy.newLead.contactHeading;

  return (
    <EmailLayout locale={props.locale} preview={`${heading}: ${props.name}`}>
      <EmailHeading>{heading}</EmailHeading>
      <Paragraph>{copy.newLead.intro}</Paragraph>
      <Field label={copy.labels.name} value={props.name} />
      <Field label={copy.labels.email} value={props.email} />
      {props.phone ? <Field label={copy.labels.phone} value={props.phone} /> : null}
      {props.company ? <Field label={copy.labels.company} value={props.company} /> : null}
      {props.kind === 'quote' ? (
        <>
          <Field
            label={copy.labels.services}
            value={props.services.map((service) => copy.services[service]).join('، ')}
          />
          <Field label={copy.labels.budget} value={copy.budgets[props.budgetRange]} />
          <Field label={copy.labels.timeline} value={copy.timelines[props.timeline]} />
          <Field label={copy.labels.details} value={props.projectDetails} />
        </>
      ) : (
        <Field label={copy.labels.message} value={props.message} />
      )}
      <PrimaryButton href={props.adminUrl}>{copy.newLead.openInAdmin}</PrimaryButton>
    </EmailLayout>
  );
}

NewLeadNotification.PreviewProps = {
  locale: DEFAULT_LOCALE,
  kind: 'quote',
  name: 'سارة أحمد',
  email: 'sara@example.com',
  phone: '+966500000000',
  services: ['ECOMMERCE', 'SALLA'],
  budgetRange: 'FROM_5K_TO_15K',
  timeline: 'ONE_TO_THREE_MONTHS',
  projectDetails: 'نحتاج متجرًا على سلة مع ربط بنظام المخزون.',
  adminUrl: 'http://localhost:3000/admin/quotes/preview',
} satisfies NewLeadNotificationProps;

export default NewLeadNotification;
