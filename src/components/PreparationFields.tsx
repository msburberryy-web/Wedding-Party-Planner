import { OWNER_COLORS, PREPARATION_OWNERS, programPreparations, type Preparation } from '../constants/programPreparation';

export function PreparationFields({ activity, onChange }: {
  activity: Parameters<typeof programPreparations>[0];
  onChange: (preparations: Preparation[]) => void;
}) {
  const rows = programPreparations(activity);
  const update = (index: number, patch: Partial<Preparation>) =>
    onChange(rows.map((row, i) => i === index ? { ...row, ...patch } : row));
  return (
    <details className="mt-3 rounded-lg border border-stone-200 p-2 text-sm">
      <summary className="cursor-pointer text-wedding-olive">準備メモ（{rows.length}件）</summary>
      {rows.map((row, index) => (
        <div key={index} className="mt-2 grid min-w-0 gap-2 rounded-lg bg-stone-50 p-2">
          <textarea aria-label="準備内容" rows={2} value={row.item}
            className="w-full min-w-0 rounded border border-stone-200 px-2 py-1 text-base"
            onChange={event => update(index, { item: event.target.value })} />
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
            <button type="button" className="p-2 text-xs text-red-700" aria-label={`準備メモ${index + 1}を削除`}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}>削除</button>
          </div>
        </div>
      ))}
      <button type="button" className="mt-2 p-1 text-xs text-wedding-olive underline"
        onClick={() => onChange([...rows, { item: '', owner: '未定', readyTime: '' }])}>準備メモを追加</button>
    </details>
  );
}
