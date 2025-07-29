import { RRule, RRuleSet } from 'rrule';

export function expandRecurrence({ pattern, exceptions }, start, end) {
  const rule = new RRule({
    ...pattern,
    dtstart: new Date(start),
    until: new Date(end)
  });
  let rset = new RRuleSet();
  rset.rrule(rule);
  (exceptions || []).forEach(ex => rset.exdate(new Date(ex)));
  return rset.between(new Date(start), new Date(end));
}