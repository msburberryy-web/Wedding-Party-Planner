import { programPreparations, type Preparation } from '../constants/programPreparation';

export function PreparationFields({ activity, onChange }: {
  activity: Parameters<typeof programPreparations>[0];
  onChange: (preparations: Preparation[]) => void;
}) {
  const notes = programPreparations(activity).map(row => row.item).join('\n');

  return (
    <label className="grid gap-1 text-xs text-stone-600">
      準備メモ
      <textarea key={notes} rows={3} defaultValue={notes}
        onBlur={event => {
          const items = event.target.value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
          if (items.join('\n') !== notes) {
            onChange(items.map(item => ({ item, owner: '未定', readyTime: '' })));
          }
        }}
        className="w-full min-w-0 rounded border border-stone-200 px-2 py-1 text-base" />
    </label>
  );
}
