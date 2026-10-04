import { HONEYPOT_FIELD } from '@codex/shared/constants';

/**
 * The bot trap: a field people never see or reach (off screen, out of the tab order, hidden
 * from assistive tech). Bots that fill every input fill it, and the API discards their
 * submission. Uncontrolled: the form reads it by name on submit.
 */
export function Honeypot({ id }: { id: string }) {
  return (
    <div aria-hidden className="absolute -start-[9999px] size-px overflow-hidden">
      <label htmlFor={id}>{HONEYPOT_FIELD}</label>
      <input id={id} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
