import { VENDOR_ROLES, type VendorArrival } from '../constants/programPreparation';

export function VendorArrivals({ rows, onChange }: {
  rows?: VendorArrival[];
  onChange: (rows: VendorArrival[]) => void;
}) {
  const entries = rows ?? VENDOR_ROLES.map(role => ({ role, name: '', arrival: '', ready: '' }));
  const update = (index: number, patch: Partial<VendorArrival>) =>
    onChange(entries.map((entry, i) => i === index ? { ...entry, ...patch } : entry));
  const field = 'w-full min-w-0 rounded-lg border border-stone-200 bg-white px-2 py-1 text-base';
  return (
    <details className="glass-card rounded-2xl p-4">
      <summary className="cursor-pointer font-semibold text-wedding-olive">業者到着・準備完了</summary>
      <div className="mt-3 space-y-2">
        {entries.map((entry, index) => (
          <div key={index} className="grid min-w-0 gap-2 rounded-lg border border-stone-200 p-2 text-xs">
            <label>役割<input className={field} value={entry.role} onChange={e => update(index, { role: e.target.value })} /></label>
            <label>業者・担当者<input className={field} value={entry.name} onChange={e => update(index, { name: e.target.value })} /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="min-w-0">到着<input type="time" className={field} value={entry.arrival} onChange={e => update(index, { arrival: e.target.value })} /></label>
              <label className="min-w-0">準備完了<input type="time" className={field} value={entry.ready} onChange={e => update(index, { ready: e.target.value })} /></label>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="mt-2 p-1 text-sm text-wedding-olive underline"
        onClick={() => onChange([...entries, { role: '', name: '', arrival: '', ready: '' }])}>業者を追加</button>
    </details>
  );
}
