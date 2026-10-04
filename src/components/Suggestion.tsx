import type { Settings } from '../data/types';
import type { Advice, Option } from '../advice/engine';
import { capitalize, withArticle } from '../lib/format';
import { formatClockMin, formatTime } from '../lib/time';

interface Props {
  advice: Advice;
  settings: Settings;
  /** Log the suggested drink in one tap. */
  onLogOption: (option: Option) => void;
  onAdd: () => void;
}

/**
 * The next move, in one sentence, with the one-tap way to act on it. The
 * "+ Add drink" button lives here on wide screens; on phones it is pinned
 * to the bottom of the screen instead (see App).
 */
export function Suggestion({ advice, settings, onLogOption, onAdd }: Props) {
  const { verdict: v, profile: p } = advice;
  const range = `${p.floorMg}–${p.ceilingMg} mg`;

  let title: string;
  let detail: string;
  let option: Option | null = null;
  let tone: 'go' | 'wait' | 'stop' = 'wait';

  switch (v.kind) {
    case 'have-now':
      option = v.option;
      tone = 'go';
      title = `Have ${withArticle(v.option.label)} now`;
      detail = `${v.option.mg} mg keeps you in your focus range ${
        v.inRangeUntil ? `until ${formatTime(v.inRangeUntil)}` : 'through your focus hours'
      }.`;
      break;
    case 'top-up':
      title = `Top up at ${formatTime(v.at)}`;
      detail = `${capitalize(withArticle(v.option.label))} (${v.option.mg} mg) then keeps you steady${
        advice.dipAt ? ` past your dip at ${formatTime(advice.dipAt)}` : ''
      }.`;
      break;
    case 'set':
      title = v.until ? `You’re set until ${formatTime(v.until)}` : 'You’re set';
      detail = `Caffeine is where it helps (${range}). No need for more right now.`;
      break;
    case 'skip-high':
      tone = 'stop';
      title = 'Skip the next one';
      detail = `You’re near the top of your range (${p.ceilingMg} mg). More would add jitters, not focus.`;
      break;
    case 'done':
      tone = 'stop';
      title = 'Done for today';
      detail =
        v.reason === 'sleep'
          ? `Another drink now would leave more than ${settings.bedtimeTargetMg} mg active at bedtime (${formatTime(advice.bedtime)}).`
          : `You’ve reached today’s limit for your weight (${p.maxDailyMg} mg).`;
      break;
    case 'outside':
      title = v.when === 'before' ? `Focus hours start at ${formatTime(v.nextStart)}` : 'Focus hours are over';
      detail =
        v.when === 'before'
          ? 'Have your first drink around then. A suggestion appears here.'
          : `Tomorrow starts at ${formatTime(v.nextStart)}. Tonight is for winding down.`;
      break;
  }

  return (
    <section className="suggestion" data-tone={tone} aria-labelledby="suggestion-title">
      <div className="suggestion__body">
        <p className="suggestion__kicker">
          Suggestion
          <span className="suggestion__source">
            {' '}
            · from research and your drinks{p.startLearned ? `, day starts ~${formatClockMin(new Date(p.focusStart).getHours() * 60 + new Date(p.focusStart).getMinutes())}` : ''}
          </span>
        </p>
        <h2 className="suggestion__title" id="suggestion-title" aria-live="polite">
          {title}
        </h2>
        <p className="suggestion__detail">{detail}</p>
        {!p.weightKnown && (
          <p className="suggestion__hint">
            Assuming 70 kg. <a href="#/calibrate">Add your weight</a> for advice sized to you.
          </p>
        )}
      </div>
      <div className="suggestion__actions">
        {option && (
          <button className="btn btn--key" type="button" onClick={() => onLogOption(option!)}>
            Log {option.label} · {option.mg} mg
          </button>
        )}
        <button className="add-button add-button--inline" type="button" onClick={onAdd} aria-keyshortcuts="a">
          <span aria-hidden="true">+</span> Add drink
        </button>
      </div>
    </section>
  );
}
