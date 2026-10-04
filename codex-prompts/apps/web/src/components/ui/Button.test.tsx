import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('stays disabled while loading even when the caller passes disabled={false}', () => {
    const html = renderToStaticMarkup(
      <Button disabled={false} isLoading>
        Send
      </Button>,
    );
    expect(html).toMatch(/<button[^>]* disabled=""/);
    expect(html).toContain('aria-busy="true"');
  });

  it('is enabled when neither disabled nor loading', () => {
    expect(renderToStaticMarkup(<Button>Send</Button>)).not.toContain(' disabled=""');
  });
});
