import type { BudgetRange, ProjectTimeline, ServiceOffering } from '@codex/shared';

/** Every string an email shows, per locale (no copy is hard-coded in templates). */
export interface EmailMessages {
  brand: { name: string; tagline: string; footer: string };
  labels: {
    name: string;
    email: string;
    phone: string;
    company: string;
    services: string;
    budget: string;
    timeline: string;
    details: string;
    message: string;
  };
  newLead: {
    quoteSubject: (name: string) => string;
    contactSubject: (name: string) => string;
    quoteHeading: string;
    contactHeading: string;
    intro: string;
    openInAdmin: string;
  };
  quoteConfirmation: {
    subject: string;
    heading: (name: string) => string;
    body: string;
    servicesIntro: string;
    nextSteps: string;
  };
  contactConfirmation: { subject: string; heading: (name: string) => string; body: string };
  passwordReset: {
    subject: string;
    heading: (name: string) => string;
    body: (minutes: number) => string;
    button: string;
    ignore: string;
  };
  services: Record<ServiceOffering, string>;
  budgets: Record<BudgetRange, string>;
  timelines: Record<ProjectTimeline, string>;
}
