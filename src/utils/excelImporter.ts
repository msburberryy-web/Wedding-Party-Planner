import ExcelJS, { type Cell } from 'exceljs';
import { DEFAULT_MUSIC, type Activity } from '../constants/activities';
import type { WeddingMetadata } from './excelGenerator';

function valueOf(cell: Cell) {
  const value = cell.value;
  return value && typeof value === 'object' && 'result' in value ? value.result : value;
}

function textOf(cell: Cell): string {
  const value = valueOf(cell);
  if (value == null) return '';
  if (typeof value === 'object' && 'richText' in value) return value.richText.map(part => part.text).join('').trim();
  if (typeof value === 'object' && 'hyperlink' in value) {
    return value.text === value.hyperlink ? value.text : [value.text, value.hyperlink].filter(Boolean).join('\n');
  }
  return String(value).trim();
}

function timesOf(cell: Cell): number[] {
  const value = valueOf(cell);
  if (value instanceof Date) return [value.getUTCHours() * 60 + value.getUTCMinutes()];
  if (typeof value === 'number') return [Math.round((value % 1) * 1440) % 1440];
  return [...textOf(cell).normalize('NFKC').matchAll(/(?:^|[^\d])(\d{1,2}):([0-5]\d)(?::[0-5]\d)?/g)]
    .map(([, hour, minute]) => Number(hour) * 60 + Number(minute))
    .filter(minutes => minutes < 1440);
}

export async function importWeddingExcel(buffer: ArrayBuffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets.find(candidate =>
    ['時間', '進行', '場所', '内容', 'BGM', 'スタッフ'].every((label, index) =>
      textOf(candidate.getRow(8).getCell([1, 3, 4, 5, 8, 10][index])) === label
    )
  );
  if (!sheet) throw new Error('進行表の見出し（時間・進行・場所・内容・BGM・スタッフ）を確認してください。');

  const top = (address: string) => textOf(sheet.getCell(address));
  const dateCell = valueOf(sheet.getCell('A2'));
  const dateParts = top('A2').normalize('NFKC').match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  const date = dateCell instanceof Date ? dateCell.toISOString().slice(0, 10) : dateParts
    ? dateParts.slice(1).map((part, i) => i ? part.padStart(2, '0') : part).join('-') : '';
  const person = (address: string) => top(address).replace(/^(新郎|新婦)\s*/, '').replace(/\s*様$/, '');
  const metadata: WeddingMetadata = {
    venue: top('A1').replace(/[_\s]*WEDDING PARTY PLAN$/i, ''),
    date, groomName: person('A6'), brideName: person('C6'),
    groomFurigana: top('B5'), brideFurigana: top('D5'),
    guestCount: Number(top('I5').normalize('NFKC').match(/\d+/)?.[0] ?? 0),
    staffName: top('I6'), mcName: top('I7'),
    photographers: {
      postHairMakeup: /^(あり|yes|○|〇)$/i.test(top('F2')),
      commemorative: top('F3'), snapshot: top('F4'), vtr: top('F6'),
    },
  };
  const rows: { activity: Activity; start?: number; end?: number; child: boolean }[] = [];
  sheet.eachRow((row, index) => {
    if (index <= 8) return;
    const [name, location, content, music, staffText] = [3, 4, 5, 8, 10].map(column => textOf(row.getCell(column)));
    const [start, end] = timesOf(row.getCell(1));
    if (start === undefined && ![name, location, content, music, staffText].some(Boolean)) return;
    const status = content.match(/^(要確認|確認済み|Need review|Confirmed)(?:\r?\n|$)/i);
    rows.push({ start, end, child: /^↳/.test(name), activity: {
      id: `sheet-${index}`, name: name.replace(/^↳\s*/, ''), duration: 0, isOptional: false,
      location, coordinationNotesJa: status ? content.slice(status[0].length) : content,
      reviewStatus: /^(確認済み|confirmed)$/i.test(status?.[1] ?? '') ? 'confirmed' : 'needs-review',
      bgm: music === DEFAULT_MUSIC ? '' : music.replace(/^(?:[①-⑳]|\(\d+\))\s+/, ''),
      staffText, omitTime: start === undefined, showTimeRange: end !== undefined,
    } });
  });
  const firstTimed = rows.findIndex(row => row.start !== undefined && !row.child);
  if (firstTimed < 0) throw new Error('時刻が入っている進行行がありません。');
  const entrance = rows.findIndex(row => row.start !== undefined && !row.child &&
    /^(?:開会|(?:新郎新婦|お二人)?\s*(?:ご)?入場(?!待機|スタンバイ)|opening|entrance)/i.test(row.activity.name));
  const anchorIndex = entrance < 0 ? firstTimed : entrance;
  const anchor = rows[anchorIndex].start!;
  const activities: Activity[] = [];
  let parentStart = anchor;
  for (const [index, row] of rows.entries()) {
    const { activity, start, end, child } = row;
    const following = rows.slice(index + 1).find(next => !next.child && next.start !== undefined && next.start > (start ?? Infinity))?.start;
    if (end !== undefined && start !== undefined) activity.duration = (end - start + 1440) % 1440;
    else if (!child && start !== undefined && following !== undefined) activity.duration = following - start;
    if (child && activities.length) {
      const parent = activities[activities.length - 1];
      const previous = parent.subActivities?.at(-1);
      activity.startOffset = start === undefined ? (previous?.startOffset ?? 0) + (previous?.duration ?? 0) : start - parentStart;
      parent.subActivities = [...(parent.subActivities ?? []), activity];
      continue;
    }
    activity.isPrep = index < anchorIndex;
    if (start !== undefined) {
      activity.fixedStartOffset = start - anchor;
      parentStart = start;
    }
    activities.push(activity);
  }
  return { activities, metadata, startTime: `${String(Math.floor(anchor / 60)).padStart(2, '0')}:${String(anchor % 60).padStart(2, '0')}` };
}
