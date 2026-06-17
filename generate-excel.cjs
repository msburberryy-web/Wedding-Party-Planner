const ExcelJS = require('exceljs');
const { format, parse, addMinutes } = require('date-fns');
const { ja } = require('date-fns/locale');
const path = require('path');

const planFile = require('./public/client plans/2026-06-21-LouisHtoo.json');

const metadata = planFile.metadata;
const startTime = planFile.startTime;

// Recalculate timeline from activities and startTime
function buildTimeline(activities, startTimeStr) {
  const mainStart = parse(startTimeStr, 'HH:mm', new Date());
  const anchorIndex = activities.findIndex(a => !a.isPrep);

  const calculated = new Array(activities.length);

  let cur = mainStart;
  for (let i = anchorIndex; i < activities.length; i++) {
    const act = activities[i];
    const start = format(cur, 'HH:mm');
    const actStart = new Date(cur);
    cur = addMinutes(cur, act.duration);
    const end = format(cur, 'HH:mm');
    const subActivities = (act.subActivities || []).map(sub => {
      const subStart = addMinutes(actStart, sub.startOffset || 0);
      const subEnd = addMinutes(subStart, sub.duration);
      return { ...sub, startTime: format(subStart, 'HH:mm'), endTime: format(subEnd, 'HH:mm') };
    });
    calculated[i] = { ...act, startTime: start, endTime: end, subActivities };
  }

  let curPrep = mainStart;
  for (let i = anchorIndex - 1; i >= 0; i--) {
    const act = activities[i];
    const end = format(curPrep, 'HH:mm');
    curPrep = addMinutes(curPrep, -act.duration);
    const start = format(curPrep, 'HH:mm');
    calculated[i] = { ...act, startTime: start, endTime: end };
  }

  return calculated;
}

async function generate() {
  const lang = planFile.language || 'en';
  const resolveName = (act) =>
    lang === 'ja' ? (act.nameJa || act.name)
    : lang === 'my' ? (act.nameMy || act.name)
    : (act.nameEn || act.name);

  const timeline = buildTimeline(planFile.activities, startTime).map(act => ({
    ...act,
    name: resolveName(act),
    subActivities: (act.subActivities || []).map(sub => ({
      ...sub,
      name: resolveName(sub)
    }))
  }));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Wedding Plan');

  sheet.columns = [
    { width: 8,  style: { font: { name: 'MS P Mincho' } } },
    { width: 8,  style: { font: { name: 'MS P Mincho' } } },
    { width: 25, style: { font: { name: 'MS P Mincho' } } },
    { width: 15, style: { font: { name: 'MS P Mincho' } } },
    { width: 15, style: { font: { name: 'MS P Mincho' } } },
    { width: 15, style: { font: { name: 'MS P Mincho' } } },
    { width: 15, style: { font: { name: 'MS P Mincho' } } },
    { width: 10, style: { font: { name: 'MS P Mincho' } } },
    { width: 15, style: { font: { name: 'MS P Mincho' } } },
  ];

  // Row 1: Title
  sheet.mergeCells('A1:I1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `${metadata.venue}_WEDDING PARTY PLAN`;
  titleCell.font = { name: 'MS P Mincho', size: 18, bold: true, underline: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 35;

  // Row 2-4: Date (Left) & Photographers (Right)
  sheet.mergeCells('A2:D4');
  const dateCell = sheet.getCell('A2');
  try {
    dateCell.value = format(new Date(metadata.date), 'yyyy 年 M 月 d 日 ( EEEE )', { locale: ja });
  } catch (e) {
    dateCell.value = metadata.date;
  }
  dateCell.font = { name: 'MS P Mincho', size: 16, bold: true };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

  sheet.getCell('E2').value = 'ヘアメイク後撮影';
  sheet.getCell('E2').border = { top: { style: 'thick' }, left: { style: 'thick' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
  sheet.mergeCells('F2:G2');
  const yellowCell = sheet.getCell('F2');
  yellowCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
  yellowCell.border = { top: { style: 'thick' }, right: { style: 'thick' }, bottom: { style: 'thin' } };
  if (metadata.photographers && metadata.photographers.postHairMakeup) {
    yellowCell.value = 'あり';
    yellowCell.alignment = { horizontal: 'center' };
  }

  sheet.getCell('E3').value = '記念撮影';
  sheet.getCell('E3').border = { left: { style: 'thick' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
  sheet.mergeCells('F3:G3');
  sheet.getCell('F3').value = (metadata.photographers && metadata.photographers.commemorative) || '';
  sheet.getCell('F3').border = { right: { style: 'thick' }, bottom: { style: 'thin' } };

  sheet.mergeCells('E4:E5');
  sheet.getCell('E4').value = 'スナップ';
  sheet.getCell('E4').alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getCell('E4').border = { left: { style: 'thick' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
  sheet.mergeCells('F4:G4');
  sheet.getCell('F4').value = (metadata.photographers && metadata.photographers.snapshot) || '';
  sheet.getCell('F4').border = { right: { style: 'thick' }, bottom: { style: 'thin' } };

  sheet.mergeCells('F5:G5');
  sheet.getCell('F5').border = { right: { style: 'thick' }, bottom: { style: 'thin' } };

  sheet.getCell('H5').value = '大人';
  sheet.getCell('H5').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('H5').border = { bottom: { style: 'thin' }, right: { style: 'thin' } };
  sheet.getCell('I5').value = `${metadata.guestCount}  名様`;
  sheet.getCell('I5').alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getCell('I5').border = { bottom: { style: 'thin' }, right: { style: 'thick' } };

  sheet.getCell('A5').value = 'フリガナ';
  sheet.getCell('A5').font = { name: 'MS P Mincho', size: 8 };
  sheet.getCell('A5').border = { top: { style: 'thick' }, left: { style: 'thick' } };
  sheet.getCell('C5').value = 'フリガナ';
  sheet.getCell('C5').font = { name: 'MS P Mincho', size: 8 };
  sheet.getCell('C5').border = { top: { style: 'thick' }, left: { style: 'thick' } };

  sheet.mergeCells('A6:B6');
  sheet.getCell('A6').value = `新郎   ${metadata.groomName}   様`;
  sheet.getCell('A6').font = { name: 'MS P Mincho', size: 12 };
  sheet.getCell('A6').alignment = { vertical: 'middle' };
  sheet.getCell('A6').border = { bottom: { style: 'thick' }, left: { style: 'thick' }, right: { style: 'thin' } };
  if (metadata.groomFurigana) sheet.getCell('B5').value = metadata.groomFurigana;

  sheet.mergeCells('C6:D6');
  sheet.getCell('C6').value = `新婦   ${metadata.brideName}   様`;
  sheet.getCell('C6').font = { name: 'MS P Mincho', size: 12 };
  sheet.getCell('C6').alignment = { vertical: 'middle' };
  sheet.getCell('C6').border = { bottom: { style: 'thick' }, left: { style: 'thick' }, right: { style: 'thick' } };
  if (metadata.brideFurigana) sheet.getCell('D5').value = metadata.brideFurigana;

  sheet.mergeCells('E6:E7');
  sheet.getCell('E6').value = 'VTR撮影';
  sheet.getCell('E6').alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getCell('E6').border = { left: { style: 'thick' }, right: { style: 'thin' }, bottom: { style: 'thick' } };
  sheet.mergeCells('F6:G6');
  sheet.getCell('F6').value = (metadata.photographers && metadata.photographers.vtr) || '';
  sheet.getCell('F6').border = { right: { style: 'thick' }, bottom: { style: 'thin' } };
  sheet.mergeCells('F7:G7');
  sheet.getCell('F7').border = { right: { style: 'thick' }, bottom: { style: 'thick' } };

  sheet.getCell('H6').value = '担当';
  sheet.getCell('H6').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('H6').border = { bottom: { style: 'thin' }, right: { style: 'thin' } };
  sheet.getCell('I6').value = metadata.staffName;
  sheet.getCell('I6').alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getCell('I6').border = { bottom: { style: 'thin' }, right: { style: 'thick' } };

  sheet.getCell('H7').value = 'MC';
  sheet.getCell('H7').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('H7').border = { bottom: { style: 'thick' }, right: { style: 'thin' } };
  sheet.getCell('I7').value = metadata.mcName;
  sheet.getCell('I7').alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getCell('I7').border = { bottom: { style: 'thick' }, right: { style: 'thick' } };

  // Table headers row 8
  const headerRow = sheet.getRow(8);
  sheet.mergeCells('A8:B8');
  sheet.getCell('A8').value = '時間';
  sheet.getCell('C8').value = '進行';
  sheet.getCell('D8').value = '場所';
  sheet.mergeCells('E8:G8');
  sheet.getCell('E8').value = '内容';
  sheet.mergeCells('H8:I8');
  sheet.getCell('H8').value = 'BGM';

  ['A8', 'C8', 'D8', 'E8', 'H8'].forEach(ref => {
    const cell = sheet.getCell(ref);
    cell.font = { name: 'MS P Mincho', bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
    cell.border = { top: { style: 'thick' }, bottom: { style: 'double' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });
  sheet.getCell('A8').border = { top: { style: 'thick' }, bottom: { style: 'double' }, left: { style: 'thick' }, right: { style: 'thin' } };
  sheet.getCell('H8').border = { top: { style: 'thick' }, bottom: { style: 'double' }, left: { style: 'thin' }, right: { style: 'thick' } };
  headerRow.height = 30;

  // Data rows
  let currentRow = 9;
  let bgmCounter = 0;

  timeline.forEach(act => {
    const row = sheet.getRow(currentRow);
    row.height = 35;

    sheet.mergeCells(`A${currentRow}:B${currentRow}`);
    const timeCell = row.getCell(1);
    timeCell.value = act.startTime;
    timeCell.alignment = { horizontal: 'center', vertical: 'middle' };
    timeCell.font = { name: 'MS P Mincho', bold: true };
    timeCell.border = { left: { style: 'thick' }, right: { style: 'thin' }, bottom: { style: 'dotted' } };

    const nameCell = row.getCell(3);
    let nameText = act.name;
    if (act.needsMic) nameText += ' 🎤';
    if (act.onStage) nameText += ' 🎭';
    nameCell.value = nameText;
    nameCell.alignment = { vertical: 'middle', wrapText: true, indent: 1 };
    nameCell.border = { right: { style: 'thin' }, bottom: { style: 'dotted' } };
    if (act.isPrep) nameCell.font = { name: 'MS P Mincho', italic: true, color: { argb: 'FF666666' } };

    const locCell = row.getCell(4);
    locCell.value = act.location || '';
    locCell.alignment = { horizontal: 'center', vertical: 'middle' };
    locCell.border = { right: { style: 'thin' }, bottom: { style: 'dotted' } };

    sheet.mergeCells(`E${currentRow}:G${currentRow}`);
    const contentCell = row.getCell(5);
    const resolvedNotes = lang === 'ja'
      ? (act.coordinationNotesJa || act.coordinationNotes)
      : lang === 'my'
      ? (act.coordinationNotesMy || act.coordinationNotes)
      : act.coordinationNotes;
    const parts = [];
    if (act.style) parts.push(`【${act.style}】`);
    if (resolvedNotes) parts.push(resolvedNotes);
    contentCell.value = parts.join(' ');
    contentCell.alignment = { vertical: 'middle', wrapText: true };
    contentCell.border = { right: { style: 'thin' }, bottom: { style: 'dotted' } };

    sheet.mergeCells(`H${currentRow}:I${currentRow}`);
    const bgmCell = row.getCell(8);
    let bgmText = '';
    if (act.bgm) {
      bgmCounter++;
      const circled = bgmCounter <= 20 ? String.fromCharCode(0x2460 + bgmCounter - 1) : `(${bgmCounter})`;
      bgmText = `${circled} ${act.bgm}`;
    }
    bgmCell.value = bgmText;
    bgmCell.font = { name: 'MS P Mincho', italic: true, color: { argb: 'FF888888' } };
    bgmCell.alignment = { vertical: 'middle', wrapText: true };
    bgmCell.border = { right: { style: 'thick' }, bottom: { style: 'dotted' } };

    currentRow++;

    (act.subActivities || []).forEach(sub => {
      const subRow = sheet.getRow(currentRow);
      subRow.height = 25;

      sheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const subTimeCell = subRow.getCell(1);
      subTimeCell.value = `${sub.startTime} - ${sub.endTime}`;
      subTimeCell.alignment = { horizontal: 'center', vertical: 'middle' };
      subTimeCell.font = { name: 'MS P Mincho', size: 9, italic: true };
      subTimeCell.border = { left: { style: 'thick' }, right: { style: 'thin' }, bottom: { style: 'dotted' } };

      const subNameCell = subRow.getCell(3);
      subNameCell.value = `  ↳ ${sub.name}${sub.duration ? ` (${sub.duration}m)` : ''}`;
      subNameCell.alignment = { vertical: 'middle', indent: 2 };
      subNameCell.font = { name: 'MS P Mincho', size: 10, color: { argb: 'FF444444' } };
      subNameCell.border = { right: { style: 'thin' }, bottom: { style: 'dotted' } };

      subRow.getCell(4).border = { right: { style: 'thin' }, bottom: { style: 'dotted' } };

      sheet.mergeCells(`E${currentRow}:G${currentRow}`);
      subRow.getCell(5).border = { right: { style: 'thin' }, bottom: { style: 'dotted' } };

      sheet.mergeCells(`H${currentRow}:I${currentRow}`);
      const subBgmCell = subRow.getCell(8);
      if (sub.bgm) {
        bgmCounter++;
        const circled = bgmCounter <= 20 ? String.fromCharCode(0x2460 + bgmCounter - 1) : `(${bgmCounter})`;
        subBgmCell.value = `${circled} ${sub.bgm}`;
      }
      subBgmCell.font = { name: 'MS P Mincho', italic: true, color: { argb: 'FF888888' } };
      subBgmCell.alignment = { vertical: 'middle', wrapText: true };
      subBgmCell.border = { right: { style: 'thick' }, bottom: { style: 'dotted' } };

      currentRow++;
    });

    // Staff Note Rows
    if (act.staffNotes) {
      const staffEntries = [];
      if (act.staffNotes.mc) staffEntries.push({ label: '🎤 MC', text: act.staffNotes.mc, color: 'FFD6EAF8' });
      if (act.staffNotes.photo) staffEntries.push({ label: '📸 Photo/Video', text: act.staffNotes.photo, color: 'FFFDE8D8' });
      if (act.staffNotes.lighting) staffEntries.push({ label: '💡 Lighting', text: act.staffNotes.lighting, color: 'FFFEF9E7' });

      staffEntries.forEach(({ label, text, color }) => {
        const staffRow = sheet.getRow(currentRow);
        staffRow.height = 22;

        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        const staffTimeCell = staffRow.getCell(1);
        staffTimeCell.value = '';
        staffTimeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        staffTimeCell.border = { left: { style: 'thick' }, right: { style: 'thin' }, bottom: { style: 'dotted' } };

        const staffLabelCell = staffRow.getCell(3);
        staffLabelCell.value = label;
        staffLabelCell.font = { name: 'MS P Mincho', size: 9, bold: true };
        staffLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        staffLabelCell.alignment = { vertical: 'middle', horizontal: 'center' };
        staffLabelCell.border = { right: { style: 'thin' }, bottom: { style: 'dotted' } };

        const staffLocCell = staffRow.getCell(4);
        staffLocCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        staffLocCell.border = { right: { style: 'thin' }, bottom: { style: 'dotted' } };

        sheet.mergeCells(`E${currentRow}:I${currentRow}`);
        const staffContentCell = staffRow.getCell(5);
        staffContentCell.value = text;
        staffContentCell.font = { name: 'MS P Mincho', size: 9, italic: true };
        staffContentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        staffContentCell.alignment = { vertical: 'middle', wrapText: true };
        staffContentCell.border = { right: { style: 'thick' }, bottom: { style: 'dotted' } };

        currentRow++;
      });
    }
  });

  // Bottom border on last row
  const lastRow = currentRow - 1;
  ['A','B','C','D','E','F','G','H','I'].forEach(col => {
    const cell = sheet.getCell(`${col}${lastRow}`);
    const b = cell.border || {};
    cell.border = { ...b, bottom: { style: 'thick' } };
  });

  const outPath = path.join(__dirname, 'Wedding_Plan_20260621_Louis_Htoo.xlsx');
  await workbook.xlsx.writeFile(outPath);
  console.log('Generated:', outPath);
}

generate().catch(console.error);
