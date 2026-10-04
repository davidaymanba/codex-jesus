import { render } from '@react-email/render';
import type { ReactElement } from 'react';

export interface RenderedEmail {
  html: string;
  text: string;
}

/** Renders a template to both HTML and plain text (every email ships both). */
export async function renderEmail(element: ReactElement): Promise<RenderedEmail> {
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { html, text };
}
