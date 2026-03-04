import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export interface TimelineActivity {
  id: string;
  startTime: string;
  endTime: string;
  name: string;
  nameEn?: string;
  nameJa?: string;
  nameMy?: string;
  duration: number;
  location?: string;
  style?: string;
  details?: string;
  bgm?: string;
  isImportant?: boolean;
  needsMic?: boolean;
  onStage?: boolean;
  responsible?: string;
  coordinationNotes?: string;
  isPrep?: boolean;
  startOffset?: number;
  subActivities?: TimelineActivity[];
}

export interface WeddingMetadata {
  date: string;
  venue: string;
  groomName: string;
  groomFurigana?: string;
  brideName: string;
  brideFurigana?: string;
  guestCount: number;
  staffName: string;
  mcName: string;
  photographers?: {
    postHairMakeup: boolean;
    commemorative: string;
    snapshot: string;
    vtr: string;
  };
}

export const generateWeddingExcel = async (metadata: WeddingMetadata, timeline: TimelineActivity[]) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Wedding Plan');

  // Set column widths to match the image layout
  // Splitting original H (BGM) into H and I for the header section
  sheet.columns = [
    { width: 8, style: { font: { name: 'MS P Mincho' } } },  // A: Time (Start)
    { width: 8, style: { font: { name: 'MS P Mincho' } } },  // B: Time (End)
    { width: 25, style: { font: { name: 'MS P Mincho' } } }, // C: Activity Name
    { width: 15, style: { font: { name: 'MS P Mincho' } } }, // D: Location
    { width: 15, style: { font: { name: 'MS P Mincho' } } }, // E: Content 1
    { width: 15, style: { font: { name: 'MS P Mincho' } } }, // F: Content 2
    { width: 15, style: { font: { name: 'MS P Mincho' } } }, // G: Content 3
    { width: 10, style: { font: { name: 'MS P Mincho' } } }, // H: Role (Header) / BGM Part 1
    { width: 15, style: { font: { name: 'MS P Mincho' } } }, // I: Name (Header) / BGM Part 2
  ];

  // --- Header Section ---

  // Row 1: Title
  sheet.mergeCells('A1:I1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `${metadata.venue}_WEDDING PARTY PLAN`;
  titleCell.font = { name: 'MS P Mincho', size: 18, bold: true, underline: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 35;

  // Row 2-4: Date (Left) & Photographers (Right)
  
  // Date Section (A2:D4 merged)
  sheet.mergeCells('A2:D4');
  const dateCell = sheet.getCell('A2');
  try {
    dateCell.value = format(new Date(metadata.date), 'yyyy 年 M 月 d 日 ( EEEE )', { locale: ja });
  } catch (e) {
    dateCell.value = metadata.date; // Fallback if date parsing fails
  }
  dateCell.font = { name: 'MS P Mincho', size: 16, bold: true };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Photographer Section (Right Side)
  // Row 2: Post Hair/Makeup
  sheet.getCell('E2').value = 'ヘアメイク後撮影';
  sheet.getCell('E2').border = { top: { style: 'thick' }, left: { style: 'thick' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
  sheet.mergeCells('F2:G2'); // Yellow box area
  const yellowCell = sheet.getCell('F2');
  yellowCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Yellow
  yellowCell.border = { top: { style: 'thick' }, right: { style: 'thick' }, bottom: { style: 'thin' } };
  if (metadata.photographers?.postHairMakeup) {
      yellowCell.value = 'あり';
      yellowCell.alignment = { horizontal: 'center' };
  }

  // Row 3: Commemorative Photo
  sheet.getCell('E3').value = '記念撮影';
  sheet.getCell('E3').border = { left: { style: 'thick' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
  sheet.mergeCells('F3:G3');
  sheet.getCell('F3').value = metadata.photographers?.commemorative || '';
  sheet.getCell('F3').border = { right: { style: 'thick' }, bottom: { style: 'thin' } };

  // Row 4: Snapshot
  sheet.mergeCells('E4:E5');
  sheet.getCell('E4').value = 'スナップ';
  sheet.getCell('E4').alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getCell('E4').border = { left: { style: 'thick' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
  
  sheet.mergeCells('F4:G4');
  sheet.getCell('F4').value = metadata.photographers?.snapshot || '';
  sheet.getCell('F4').border = { right: { style: 'thick' }, bottom: { style: 'thin' } };

  // Row 5: Snapshot (2nd row) / Guest Count
  sheet.mergeCells('F5:G5');
  sheet.getCell('F5').border = { right: { style: 'thick' }, bottom: { style: 'thin' } };

  // Guest Count (H5 & I5)
  sheet.getCell('H5').value = '大人';
  sheet.getCell('H5').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('H5').border = { bottom: { style: 'thin' }, right: { style: 'thin' } };
  
  sheet.getCell('I5').value = `${metadata.guestCount}  名様`;
  sheet.getCell('I5').alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getCell('I5').border = { bottom: { style: 'thin' }, right: { style: 'thick' } };


  // Row 6: Names (Left) & VTR (Right) & Staff (Far Right)
  
  // Names Headers
  sheet.getCell('A5').value = 'フリガナ';
  sheet.getCell('A5').font = { name: 'MS P Mincho', size: 8 };
  sheet.getCell('A5').border = { top: { style: 'thick' }, left: { style: 'thick' } };
  
  sheet.getCell('C5').value = 'フリガナ';
  sheet.getCell('C5').font = { name: 'MS P Mincho', size: 8 };
  sheet.getCell('C5').border = { top: { style: 'thick' }, left: { style: 'thick' } };

  // Groom Name
  sheet.mergeCells('A6:B6');
  sheet.getCell('A6').value = `新郎   ${metadata.groomName}   様`;
  sheet.getCell('A6').font = { name: 'MS P Mincho', size: 12 };
  sheet.getCell('A6').alignment = { vertical: 'middle' };
  sheet.getCell('A6').border = { bottom: { style: 'thick' }, left: { style: 'thick' }, right: { style: 'thin' } };
  
  // Groom Furigana
  if (metadata.groomFurigana) {
      sheet.getCell('B5').value = metadata.groomFurigana;
  }

  // Bride Name
  sheet.mergeCells('C6:D6');
  sheet.getCell('C6').value = `新婦   ${metadata.brideName}   様`;
  sheet.getCell('C6').font = { name: 'MS P Mincho', size: 12 };
  sheet.getCell('C6').alignment = { vertical: 'middle' };
  sheet.getCell('C6').border = { bottom: { style: 'thick' }, left: { style: 'thick' }, right: { style: 'thick' } };

  // Bride Furigana
  if (metadata.brideFurigana) {
      sheet.getCell('D5').value = metadata.brideFurigana;
  }

  // VTR Section
  sheet.mergeCells('E6:E7');
  sheet.getCell('E6').value = 'VTR撮影';
  sheet.getCell('E6').alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getCell('E6').border = { left: { style: 'thick' }, right: { style: 'thin' }, bottom: { style: 'thick' } };

  sheet.mergeCells('F6:G6');
  sheet.getCell('F6').value = metadata.photographers?.vtr || '';
  sheet.getCell('F6').border = { right: { style: 'thick' }, bottom: { style: 'thin' } };

  sheet.mergeCells('F7:G7');
  sheet.getCell('F7').border = { right: { style: 'thick' }, bottom: { style: 'thick' } };

  // Staff (H6 & I6)
  sheet.getCell('H6').value = '担当';
  sheet.getCell('H6').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('H6').border = { bottom: { style: 'thin' }, right: { style: 'thin' } };

  sheet.getCell('I6').value = metadata.staffName;
  sheet.getCell('I6').alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getCell('I6').border = { bottom: { style: 'thin' }, right: { style: 'thick' } };

  // MC (H7 & I7)
  sheet.getCell('H7').value = 'MC';
  sheet.getCell('H7').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('H7').border = { bottom: { style: 'thick' }, right: { style: 'thin' } };

  sheet.getCell('I7').value = metadata.mcName;
  sheet.getCell('I7').alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getCell('I7').border = { bottom: { style: 'thick' }, right: { style: 'thick' } };


  // --- Table Headers (Row 8) ---
  const headerRow = sheet.getRow(8);
  
  sheet.mergeCells('A8:B8');
  sheet.getCell('A8').value = '時間';
  
  sheet.getCell('C8').value = '進行';
  sheet.getCell('D8').value = '場所';
  
  sheet.mergeCells('E8:G8');
  sheet.getCell('E8').value = '内容';
  
  // Merge H and I for BGM
  sheet.mergeCells('H8:I8');
  sheet.getCell('H8').value = 'BGM';

  // Style Headers
  ['A8', 'C8', 'D8', 'E8', 'H8'].forEach(cellRef => {
    const cell = sheet.getCell(cellRef);
    cell.font = { name: 'MS P Mincho', bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
    cell.border = {
      top: { style: 'thick' },
      bottom: { style: 'double' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Fix specific borders
  sheet.getCell('A8').border = { top: { style: 'thick' }, bottom: { style: 'double' }, left: { style: 'thick' }, right: { style: 'thin' } };
  sheet.getCell('H8').border = { top: { style: 'thick' }, bottom: { style: 'double' }, left: { style: 'thin' }, right: { style: 'thick' } };

  headerRow.height = 30;

  // --- Data Rows ---
  let currentRow = 9;
  let bgmCounter = 0; // Initialize BGM counter

  timeline.forEach((act) => {
    const row = sheet.getRow(currentRow);
    row.height = 35;

    // Time (A:B)
    sheet.mergeCells(`A${currentRow}:B${currentRow}`);
    const timeCell = row.getCell(1);
    timeCell.value = act.startTime;
    timeCell.alignment = { horizontal: 'center', vertical: 'middle' };
    timeCell.font = { name: 'MS P Mincho', bold: true };
    timeCell.border = { left: { style: 'thick' }, right: { style: 'thin' }, bottom: { style: 'dotted' } };

    // Activity Name (C)
    const nameCell = row.getCell(3);
    let nameText = act.name;
    if (act.needsMic) nameText += ' 🎤';
    if (act.onStage) nameText += ' 🎭';
    nameCell.value = nameText;
    nameCell.alignment = { vertical: 'middle', wrapText: true, indent: 1 };
    nameCell.border = { right: { style: 'thin' }, bottom: { style: 'dotted' } };
    if (act.isPrep) {
        nameCell.font = { name: 'MS P Mincho', italic: true, color: { argb: 'FF666666' } };
    }

    // Location (D)
    const locCell = row.getCell(4);
    locCell.value = act.location || '';
    locCell.alignment = { horizontal: 'center', vertical: 'middle' };
    locCell.border = { right: { style: 'thin' }, bottom: { style: 'dotted' } };

    // Content (E:G)
    sheet.mergeCells(`E${currentRow}:G${currentRow}`);
    const contentCell = row.getCell(5);
    const parts = [];
    if (act.style) parts.push(`【${act.style}】`);
    if (act.responsible) parts.push(`[${act.responsible}]`);
    if (act.coordinationNotes) parts.push(act.coordinationNotes);
    contentCell.value = parts.join(' ');
    contentCell.alignment = { vertical: 'middle', wrapText: true };
    contentCell.border = { right: { style: 'thin' }, bottom: { style: 'dotted' } };

    // BGM (H:I)
    sheet.mergeCells(`H${currentRow}:I${currentRow}`);
    const bgmCell = row.getCell(8);
    let bgmText = '';
    if (act.bgm) {
        bgmCounter++;
        // Use circled numbers for 1-20, fallback to (N) for >20
        const circledNumber = bgmCounter <= 20 ? String.fromCharCode(0x2460 + bgmCounter - 1) : `(${bgmCounter})`;
        bgmText = `${circledNumber} ${act.bgm}`;
    }
    bgmCell.value = bgmText;
    bgmCell.font = { name: 'MS P Mincho', italic: true, color: { argb: 'FF888888' } };
    bgmCell.alignment = { vertical: 'middle', wrapText: true };
    bgmCell.border = { right: { style: 'thick' }, bottom: { style: 'dotted' } };

    currentRow++;

    // Render Sub-activities
    if (act.subActivities && act.subActivities.length > 0) {
        act.subActivities.forEach(sub => {
            const subRow = sheet.getRow(currentRow);
            subRow.height = 25;

            // Time
            sheet.mergeCells(`A${currentRow}:B${currentRow}`);
            const subTimeCell = subRow.getCell(1);
            subTimeCell.value = `${sub.startTime} - ${sub.endTime}`;
            subTimeCell.alignment = { horizontal: 'center', vertical: 'middle' };
            subTimeCell.font = { name: 'MS P Mincho', size: 9, italic: true };
            subTimeCell.border = { left: { style: 'thick' }, right: { style: 'thin' }, bottom: { style: 'dotted' } };

            // Name (Indented)
            const subNameCell = subRow.getCell(3);
            subNameCell.value = `  ↳ ${sub.name}`;
            subNameCell.alignment = { vertical: 'middle', indent: 2 };
            subNameCell.font = { name: 'MS P Mincho', size: 10, color: { argb: 'FF444444' } };
            subNameCell.border = { right: { style: 'thin' }, bottom: { style: 'dotted' } };

            // Location
            const subLocCell = subRow.getCell(4);
            subLocCell.value = sub.location || '';
            subLocCell.alignment = { horizontal: 'center', vertical: 'middle' };
            subLocCell.border = { right: { style: 'thin' }, bottom: { style: 'dotted' } };

            // Content
            sheet.mergeCells(`E${currentRow}:G${currentRow}`);
            const subContentCell = subRow.getCell(5);
            const subParts = [];
            if (sub.style) subParts.push(`【${sub.style}】`);
            if (sub.responsible) subParts.push(`[${sub.responsible}]`);
            if (sub.coordinationNotes) subParts.push(sub.coordinationNotes);
            subContentCell.value = subParts.join(' ');
            subContentCell.alignment = { vertical: 'middle', wrapText: true };
            subContentCell.border = { right: { style: 'thin' }, bottom: { style: 'dotted' } };

            // BGM
            sheet.mergeCells(`H${currentRow}:I${currentRow}`);
            const subBgmCell = subRow.getCell(8);
            let subBgmText = '';
            if (sub.bgm) {
                bgmCounter++;
                const circledNumber = bgmCounter <= 20 ? String.fromCharCode(0x2460 + bgmCounter - 1) : `(${bgmCounter})`;
                subBgmText = `${circledNumber} ${sub.bgm}`;
            }
            subBgmCell.value = subBgmText;
            subBgmCell.font = { name: 'MS P Mincho', italic: true, color: { argb: 'FF888888' } };
            subBgmCell.alignment = { vertical: 'middle', wrapText: true };
            subBgmCell.border = { right: { style: 'thick' }, bottom: { style: 'dotted' } };

            currentRow++;
        });
    }
  });

  // Bottom Border for the last row
  const lastRowIdx = currentRow - 1;
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(col => {
      const cell = sheet.getCell(`${col}${lastRowIdx}`);
      const currentBorder = cell.border || {};
      cell.border = {
          ...currentBorder,
          bottom: { style: 'thick' }
      };
  });


  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Sanitize names for filename
  const groom = metadata.groomName.replace(/[^a-zA-Z0-9\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/g, '_');
  const bride = metadata.brideName.replace(/[^a-zA-Z0-9\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/g, '_');
  const dateStr = metadata.date.replace(/[^0-9]/g, '');
  
  saveAs(blob, `Wedding_Plan_${dateStr}_${groom}_${bride}.xlsx`);
};
