import { OWNER_COLORS, PREPARATION_OWNERS, programPreparations, type Preparation } from '../constants/programPreparation';

export function PreparationFields({ activity, onChange }: {
  activity: Parameters<typeof programPreparations>[0];
  onChange: (preparations: Preparation[]) => void;
}) {
  const rows = programPreparations(activity);
  const update = (index: number, patch: Partial<Preparation>) =>
    onChange(rows.map((row, i) => i === index ? { ...row, ...patch } : row));
  const notes = rows.map(row => row.item).join('\n');
  function updateNotes(value: string) {
    if (value === notes) return;
    const items = value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
    const matched = new Set<number>();
    const matches = items.map(item => {
      const index = rows.findIndex((row, i) => row.item === item && !matched.has(i));
      if (index >= 0) matched.add(index);
      return index;
    });
    onChange(items.map((item, i) => {
      const index = matches[i];
      const previous = index >= 0 ? rows[index]
        : items.length === rows.length && !matched.has(i) ? rows[i] : undefined;
      return { item, owner: previous?.owner ?? '未定', readyTime: previous?.readyTime ?? '' };
    }));
  }

  return (
    <div className="rounded-lg border border-stone-200 p-2 text-sm">
      <label className="grid gap-1 text-xs text-stone-600">
        準備メモ（1行に1項目）
        <textarea key={notes} rows={3} defaultValue={notes} onBlur={event => updateNotes(event.target.value)}
          className="w-full min-w-0 rounded border border-stone-200 px-2 py-1 text-base" />
      </label>
      {rows.map((row, index) => (
        <div key={index} className="mt-2 grid min-w-0 gap-1 rounded-lg bg-stone-50 p-2">
          <p className="text-xs text-stone-600 [overflow-wrap:anywhere]">{index + 1}. {row.item}</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-xs">準備担当
              <select value={row.owner} style={{ color: '#' + OWNER_COLORS[row.owner].slice(2) }}
                className="rounded border border-stone-200 bg-white px-2 py-1 text-base font-semibold"
                onChange={event => update(index, { owner: event.target.value as Preparation['owner'] })}>
                {PREPARATION_OWNERS.map(owner => <option key={owner}>{owner}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs">準備完了の目安
              <input type="time" value={row.readyTime} className="rounded border border-stone-200 px-2 py-1 text-base"
                onChange={event => update(index, { readyTime: event.target.value })} />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
