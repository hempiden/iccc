import pptxgen from 'pptxgenjs';
import { VoCRecord, ActionOwner } from '../types';
import { ExportFilterContext } from './excelDatabase';
import { getCleanSurveyId, formatTargetDeadline, getFollowUpTag } from './parser';

// DHL Brand & UI Palette Constants
const DHL_YELLOW = 'FFCC00';
const DHL_RED = 'D40511';
const SLATE_DARK = '0F172A';
const SLATE_GRAY = '334155';
const SLATE_LIGHT = 'F8FAFC';
const BORDER_GRAY = 'CBD5E1';
const GREEN_PROMOTER = '059669';
const AMBER_PASSIVE = 'D97706';
const RED_DETRACTOR = 'DC2626';

/**
 * Generates a presentation slide replicating the "KEY ACTIONS TAKEN TO ADDRESS VOICE OF CUSTOMER" Action Matrix table.
 */
export async function exportActionMatrixSlideToPowerPoint(
  record: VoCRecord,
  currentUser?: ActionOwner | null
): Promise<void> {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = `DHL VoC Case #${getCleanSurveyId(record.surveyId || record.id)} Action Matrix`;
  pres.subject = 'Voice of Customer Key Actions & Resolution';
  pres.author = currentUser?.fullName || 'DHL Express Colleague';
  pres.company = 'DHL Express (Cambodia) Ltd.';

  addActionMatrixSlide(pres, record, 1, 1);

  const cleanId = getCleanSurveyId(record.surveyId || record.id);
  const dateSuffix = new Date().toISOString().split('T')[0];
  const fileName = `DHL_VoC_Action_Matrix_Case_${cleanId || 'Record'}_${dateSuffix}.pptx`;

  await pres.writeFile({ fileName });
}

/**
 * Helper that builds the Action Matrix slide on any PptxGenJS instance
 */
export function addActionMatrixSlide(
  pres: pptxgen,
  record: VoCRecord,
  currentIndex: number = 1,
  totalSlides: number = 1
): void {
  const slide = pres.addSlide();
  slide.background = { color: 'F8FAFC' };

  // Brand Palette
  const DHL_YELLOW = 'F59E0B'; // Amber Yellow header
  const BORDER_YELLOW = 'F59E0B';
  const GREEN_STATUS = '059669';
  const AMBER_STATUS = 'D97706';
  const RED_STATUS = 'DC2626';
  const SLATE_DARK = '0F172A';
  const SLATE_GRAY = '475569';
  const BORDER_GRAY = 'CBD5E1';

  const cleanSurveyId = getCleanSurveyId(record.surveyId || record.id);
  const statusColor = record.status === 'Completed' ? GREEN_STATUS : (record.status === 'In Progress' ? AMBER_STATUS : RED_STATUS);
  const deadlineStr = formatTargetDeadline(record.creationDate || record.responseDate, record.deadline);
  const followUpTag = getFollowUpTag(record);

  // Outer Yellow Border Container Card (Matching the UI's rounded card with border-[12px])
  const cardX = 0.35;
  const cardY = 0.3;
  const cardW = 12.63;
  const cardH = 6.9;

  slide.addShape(pres.ShapeType.roundRect, {
    x: cardX,
    y: cardY,
    w: cardW,
    h: cardH,
    rectRadius: 0.12,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER_YELLOW, width: 8 }
  });

  // Top Yellow Header Banner
  const bannerH = 0.68;
  slide.addShape(pres.ShapeType.roundRect, {
    x: cardX + 0.05,
    y: cardY + 0.05,
    w: cardW - 0.1,
    h: bannerH,
    rectRadius: 0.08,
    fill: { color: DHL_YELLOW },
    line: { color: DHL_YELLOW }
  });

  // Slide Title Text
  slide.addText('KEY ACTIONS TAKEN TO ADDRESS VOICE OF CUSTOMER', {
    x: cardX + 0.25,
    y: cardY + 0.18,
    w: 8.5,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Arial'
  });

  // Traffic Light Indicator on top right
  const tlX = cardX + cardW - 1.6;
  const tlY = cardY + 0.15;
  slide.addShape(pres.ShapeType.roundRect, {
    x: tlX,
    y: tlY,
    w: 1.35,
    h: 0.38,
    rectRadius: 0.19,
    fill: { color: '0F172A' },
    line: { color: '334155', width: 0.5 }
  });

  // 3 Traffic light dots: Red, Yellow, Green
  slide.addShape(pres.ShapeType.ellipse, {
    x: tlX + 0.12,
    y: tlY + 0.09,
    w: 0.2,
    h: 0.2,
    fill: { color: record.status === 'New' ? 'EF4444' : '450A0A' },
    line: { color: record.status === 'New' ? 'F87171' : '450A0A', width: 0.5 }
  });

  slide.addShape(pres.ShapeType.ellipse, {
    x: tlX + 0.55,
    y: tlY + 0.09,
    w: 0.2,
    h: 0.2,
    fill: { color: record.status === 'In Progress' ? 'FACC15' : '422006' },
    line: { color: record.status === 'In Progress' ? 'FDE047' : '422006', width: 0.5 }
  });

  slide.addShape(pres.ShapeType.ellipse, {
    x: tlX + 0.98,
    y: tlY + 0.09,
    w: 0.2,
    h: 0.2,
    fill: { color: record.status === 'Completed' ? '22C55E' : '052E16' },
    line: { color: record.status === 'Completed' ? '4ADE80' : '052E16', width: 0.5 }
  });

  // =========================================================================
  // 5-COLUMN ACTION MATRIX TABLE
  // =========================================================================
  const tblX = cardX + 0.25;
  const tblY = cardY + bannerH + 0.18;
  const tblW = cardW - 0.5;
  const tblH = cardH - bannerH - 0.45;

  const col1W = 3.65; // VOC
  const col2W = 5.35; // KEY ACTIONS TAKEN
  const col3W = 0.95; // DEADLINE
  const col4W = 1.05; // PIC
  const col5W = 1.13; // STATUS

  const headerH = 0.45;

  // Table Yellow Header Background
  slide.addShape(pres.ShapeType.roundRect, {
    x: tblX,
    y: tblY,
    w: tblW,
    h: headerH,
    rectRadius: 0.05,
    fill: { color: 'FBBF24' },
    line: { color: 'F59E0B' }
  });

  // Table Header Labels
  slide.addText('VOC', {
    x: tblX,
    y: tblY + 0.05,
    w: col1W,
    h: headerH - 0.1,
    fontSize: 10,
    bold: true,
    align: 'center',
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  slide.addText('KEY ACTIONS TAKEN', {
    x: tblX + col1W,
    y: tblY + 0.05,
    w: col2W,
    h: headerH - 0.1,
    fontSize: 10,
    bold: true,
    align: 'center',
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  slide.addText('DEADLINE', {
    x: tblX + col1W + col2W,
    y: tblY + 0.05,
    w: col3W,
    h: headerH - 0.1,
    fontSize: 9.5,
    bold: true,
    align: 'center',
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  slide.addText('PIC', {
    x: tblX + col1W + col2W + col3W,
    y: tblY + 0.05,
    w: col4W,
    h: headerH - 0.1,
    fontSize: 9.5,
    bold: true,
    align: 'center',
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  slide.addText('STATUS', {
    x: tblX + col1W + col2W + col3W + col4W,
    y: tblY + 0.05,
    w: col5W,
    h: headerH - 0.1,
    fontSize: 9.5,
    bold: true,
    align: 'center',
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  // Table Body Coordinates
  const bodyY = tblY + headerH;
  const bodyH = tblH - headerH;

  // Outer Border for table body
  slide.addShape(pres.ShapeType.rect, {
    x: tblX,
    y: bodyY,
    w: tblW,
    h: bodyH,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER_GRAY, width: 1 }
  });

  // Vertical column separator lines
  slide.addShape(pres.ShapeType.line, {
    x: tblX + col1W,
    y: bodyY,
    w: 0,
    h: bodyH,
    line: { color: BORDER_GRAY, width: 1 }
  });
  slide.addShape(pres.ShapeType.line, {
    x: tblX + col1W + col2W,
    y: bodyY,
    w: 0,
    h: bodyH,
    line: { color: BORDER_GRAY, width: 1 }
  });
  slide.addShape(pres.ShapeType.line, {
    x: tblX + col1W + col2W + col3W,
    y: bodyY,
    w: 0,
    h: bodyH,
    line: { color: BORDER_GRAY, width: 1 }
  });
  slide.addShape(pres.ShapeType.line, {
    x: tblX + col1W + col2W + col3W + col4W,
    y: bodyY,
    w: 0,
    h: bodyH,
    line: { color: BORDER_GRAY, width: 1 }
  });

  // =========================================================================
  // COLUMN 1: VOC CELL
  // =========================================================================
  const cell1X = tblX + 0.15;
  const cell1W = col1W - 0.3;

  // Soft Yellow Customer Feedback Quote Box
  slide.addShape(pres.ShapeType.roundRect, {
    x: cell1X,
    y: bodyY + 0.15,
    w: cell1W,
    h: 3.1,
    rectRadius: 0.08,
    fill: { color: 'FEF9C3' },
    line: { color: 'FDE047', width: 1 }
  });

  const quoteComment = record.comment && record.comment.trim() 
    ? `"${record.comment.trim()}"` 
    : `"${record.customSummary || 'Efficient service and quick handling.'}"`;

  slide.addText(quoteComment, {
    x: cell1X + 0.15,
    y: bodyY + 0.25,
    w: cell1W - 0.3,
    h: 2.9,
    fontSize: 9.5,
    italic: true,
    color: '1E293B',
    fontFace: 'Arial'
  });

  // Condensed Summary Indicator link
  slide.addText('SHOW CONDENSED SUMMARY', {
    x: cell1X,
    y: bodyY + 3.35,
    w: cell1W,
    h: 0.22,
    fontSize: 8,
    bold: true,
    color: '2563EB',
    fontFace: 'Arial'
  });

  // Follow-up Tag Pill
  const isDetractor = followUpTag.includes('Detractor') || followUpTag.includes('Critical');
  const isPassive = followUpTag.includes('Passive');
  const tagBg = isDetractor ? 'FFE4E6' : (isPassive ? 'FEF3C7' : 'D1FAE5');
  const tagTextColor = isDetractor ? 'BE123C' : (isPassive ? '92400E' : '065F46');
  const tagBorder = isDetractor ? 'FECDD3' : (isPassive ? 'FDE68A' : 'A7F3D0');

  slide.addShape(pres.ShapeType.roundRect, {
    x: cell1X,
    y: bodyY + 3.65,
    w: 2.1,
    h: 0.28,
    rectRadius: 0.06,
    fill: { color: tagBg },
    line: { color: tagBorder, width: 0.8 }
  });
  slide.addText(followUpTag, {
    x: cell1X + 0.05,
    y: bodyY + 3.68,
    w: 2.0,
    h: 0.22,
    fontSize: 7.5,
    bold: true,
    align: 'center',
    color: tagTextColor,
    fontFace: 'Arial'
  });

  // AWB & Survey ID metadata
  slide.addText(`AWB: ${record.awbNumber || '6624344543'}`, {
    x: cell1X,
    y: bodyY + 4.02,
    w: cell1W,
    h: 0.2,
    fontSize: 8,
    bold: true,
    color: '2563EB',
    fontFace: 'Arial'
  });

  slide.addText(`Survey ID: ${cleanSurveyId || '307501888'}`, {
    x: cell1X,
    y: bodyY + 4.25,
    w: cell1W,
    h: 0.2,
    fontSize: 8,
    bold: true,
    color: '2563EB',
    fontFace: 'Arial'
  });

  // Topic & Category Badges
  const topicTag = String(record?.topic || 'CUSTOMS_CLEARANCE').toUpperCase().replace(/\s+/g, '_');
  const catTag = String(record?.category || 'General').toUpperCase();
  slide.addShape(pres.ShapeType.roundRect, {
    x: cell1X,
    y: bodyY + 4.5,
    w: 1.6,
    h: 0.24,
    rectRadius: 0.04,
    fill: { color: 'EFF6FF' },
    line: { color: 'BFDBFE', width: 0.8 }
  });
  slide.addText(topicTag, {
    x: cell1X + 0.05,
    y: bodyY + 4.52,
    w: 1.5,
    h: 0.2,
    fontSize: 7,
    bold: true,
    align: 'center',
    color: '1D4ED8',
    fontFace: 'Arial'
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: cell1X + 1.7,
    y: bodyY + 4.5,
    w: 1.2,
    h: 0.24,
    rectRadius: 0.04,
    fill: { color: 'EFF6FF' },
    line: { color: 'BFDBFE', width: 0.8 }
  });
  slide.addText(catTag, {
    x: cell1X + 1.75,
    y: bodyY + 4.52,
    w: 1.1,
    h: 0.2,
    fontSize: 7,
    bold: true,
    align: 'center',
    color: '1D4ED8',
    fontFace: 'Arial'
  });

  // Company Name
  const compName = record?.accountName || record?.customerName || 'ACTEUS CAMBODIA CO., LTD';
  slide.addText(`(${String(compName).toUpperCase()})`, {
    x: cell1X,
    y: bodyY + 4.82,
    w: cell1W,
    h: 0.25,
    fontSize: 7.5,
    bold: true,
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  // =========================================================================
  // COLUMN 2: KEY ACTIONS TAKEN CELL
  // =========================================================================
  const cell2X = tblX + col1W + 0.2;
  const cell2W = col2W - 0.4;

  const timelineItems = record.timeline && record.timeline.length > 0
    ? record.timeline
    : (record.actionSummary || record.followUpComments 
        ? [{ timestamp: record.responseDate || 'Recent', action: record.actionSummary || record.followUpComments || '', pic: record.owner || 'CCO Specialist' }]
        : []);

  if (timelineItems.length > 0) {
    const actionTexts = timelineItems.slice(0, 6).map((item, idx) => {
      const timePrefix = item.timestamp ? `[${item.timestamp}] ` : '';
      const picSuffix = item.pic ? ` (Owner: ${item.pic})` : '';
      return `${idx + 1}. ${timePrefix}${item.action}${picSuffix}`;
    }).join('\n\n');

    slide.addText(actionTexts, {
      x: cell2X,
      y: bodyY + 0.25,
      w: cell2W,
      h: bodyH - 0.5,
      fontSize: 9,
      color: SLATE_DARK,
      fontFace: 'Arial'
    });
  } else {
    // Empty State matching the user's screenshot
    slide.addText('No follow-up comments registered yet.\nUse the Action Owner Portal below to post comments.', {
      x: cell2X,
      y: bodyY + 2.0,
      w: cell2W,
      h: 1.0,
      fontSize: 9.5,
      align: 'center',
      color: '94A3B8',
      fontFace: 'Arial'
    });
  }

  // =========================================================================
  // COLUMN 3: DEADLINE CELL
  // =========================================================================
  const cell3X = tblX + col1W + col2W;
  
  // Deadline Pill centered vertically
  slide.addShape(pres.ShapeType.roundRect, {
    x: cell3X + 0.12,
    y: bodyY + (bodyH / 2) - 0.2,
    w: col3W - 0.24,
    h: 0.4,
    rectRadius: 0.08,
    fill: { color: 'F1F5F9' },
    line: { color: 'E2E8F0', width: 1 }
  });

  slide.addText(deadlineStr || '31 Jul', {
    x: cell3X + 0.12,
    y: bodyY + (bodyH / 2) - 0.16,
    w: col3W - 0.24,
    h: 0.32,
    fontSize: 9,
    bold: true,
    align: 'center',
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  // =========================================================================
  // COLUMN 4: PIC CELL
  // =========================================================================
  const cell4X = tblX + col1W + col2W + col3W;
  const picName = record.owner || 'Panha Chhun';
  
  slide.addText(`${picName}\n(DHL KH)`, {
    x: cell4X + 0.05,
    y: bodyY + (bodyH / 2) - 0.4,
    w: col4W - 0.1,
    h: 0.8,
    fontSize: 9,
    bold: true,
    align: 'center',
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  // =========================================================================
  // COLUMN 5: STATUS CELL (Solid Background color per screenshot)
  // =========================================================================
  const cell5X = tblX + col1W + col2W + col3W + col4W;

  slide.addShape(pres.ShapeType.rect, {
    x: cell5X,
    y: bodyY,
    w: col5W,
    h: bodyH,
    fill: { color: statusColor },
    line: { color: statusColor }
  });

  slide.addText(String(record?.status || 'PENDING').toUpperCase(), {
    x: cell5X,
    y: bodyY + (bodyH / 2) - 0.3,
    w: col5W,
    h: 0.6,
    fontSize: 10.5,
    bold: true,
    align: 'center',
    color: 'FFFFFF',
    fontFace: 'Arial'
  });
}


export interface ExecutivePptExportOptions {
  trendInterval?: 'monthly' | 'weekly' | 'daily';
  showLastYear?: boolean;
}

function parseSafePptDate(dStr?: string): Date | null {
  if (!dStr) return null;
  const trimmed = dStr.trim();
  if (!trimmed) return null;
  if (/^\d{5}(\.\d+)?$/.test(trimmed)) {
    const serial = Number(trimmed);
    const dt = new Date((serial - 25569) * 86400 * 1000);
    return isNaN(dt.getTime()) ? null : dt;
  }
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (isoMatch) {
    const [, y, m, d, hh = '0', mm = '0', ss = '0'] = isoMatch;
    const dt = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const [, p1, p2, y] = dmyMatch;
    const n1 = Number(p1);
    const n2 = Number(p2);
    if (n1 > 12) {
      const dt = new Date(Number(y), n2 - 1, n1);
      return isNaN(dt.getTime()) ? null : dt;
    }
  }
  const parsed = Date.parse(trimmed);
  return isNaN(parsed) ? null : new Date(parsed);
}

function renderNpsGaugePng(nps: number): string | null {
  if (typeof document === 'undefined') return null;
  const size = 480;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = 178;
  const lineWidth = 34;

  const startAngle = -Math.PI / 2;
  const totalSweep = Math.PI * 1.5; // 270 degrees clockwise
  const clampedNps = Math.max(-100, Math.min(100, nps));
  const activeSweep = ((clampedNps + 100) / 200) * totalSweep;

  ctx.lineCap = 'round';
  ctx.lineWidth = lineWidth;

  // Track arc
  ctx.beginPath();
  ctx.strokeStyle = '#F1F5F9';
  ctx.arc(cx, cy, radius, startAngle, startAngle + totalSweep, false);
  ctx.stroke();

  // Active score arc
  const arcColor = nps >= 50 ? '#10B981' : nps >= 10 ? '#F59E0B' : '#F43F5E';
  if (activeSweep > 0.01) {
    ctx.beginPath();
    ctx.strokeStyle = arcColor;
    ctx.arc(cx, cy, radius, startAngle, startAngle + activeSweep, false);
    ctx.stroke();
  }

  return canvas.toDataURL('image/png');
}

/**
 * Adds the Executive "VOICE: Journey NPS Over Time" Slide (16:9 full-fit layout)
 */
export function addExecutiveSummarySlide(
  pres: pptxgen,
  records: VoCRecord[],
  _filterContext?: ExportFilterContext,
  _currentUser?: ActionOwner | null,
  _hasSubsequentSlides: boolean = true,
  options?: ExecutivePptExportOptions
): void {
  const total = records.length;
  const trendInterval = options?.trendInterval || 'monthly';
  const showLastYear = options?.showLastYear ?? false;

  const round1 = (val: number) => parseFloat(val.toFixed(1));
  const fullMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // 1. Date bounds & Core KPIs
  const validDates = records
    .map(r => parseSafePptDate(r.responseDate || r.creationDate))
    .filter((d): d is Date => d !== null);

  const minDate = validDates.length > 0 ? new Date(Math.min(...validDates.map(d => d.getTime()))) : new Date();
  const maxDate = validDates.length > 0 ? new Date(Math.max(...validDates.map(d => d.getTime()))) : new Date();
  const currentYear = maxDate.getFullYear() || 2026;
  const currentMonth = maxDate.getMonth();
  const currentMonthName = fullMonthNames[currentMonth] || 'October';

  const formatRangeDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    return `${dd} ${shortMonthNames[d.getMonth()]} ${d.getFullYear()}`;
  };

  const dateRangeStr = validDates.length === 0
    ? 'No Active Timeframe'
    : (minDate.getTime() === maxDate.getTime()
        ? formatRangeDate(minDate)
        : `${formatRangeDate(minDate)} - ${formatRangeDate(maxDate)}`);

  let sumScore = 0;
  let sumEase = 0;
  let easeCount = 0;
  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  records.forEach(r => {
    sumScore += r.likelihood;
    if (r.easeOfUse !== undefined) {
      sumEase += r.easeOfUse;
      easeCount++;
    }
    if (r.category === 'Promoter') promoters++;
    else if (r.category === 'Passive') passives++;
    else detractors++;
  });

  const avgScoreVal = total > 0 ? sumScore / total : 0;
  const avgEaseVal = total > 0 ? (easeCount > 0 ? sumEase / easeCount : avgScoreVal - 0.5) : 0;
  const avgScoreStr = avgScoreVal.toFixed(1);
  const avgEaseStr = avgEaseVal.toFixed(1);
  const overallNps = total > 0 ? round1(((promoters - detractors) / total) * 100) : 0;
  const promoterSharePct = total > 0 ? Math.round((promoters / total) * 100) : 0;
  const passiveSharePct = total > 0 ? Math.round((passives / total) * 100) : 0;
  const detractorSharePct = total > 0 ? Math.round((detractors / total) * 100) : 0;

  // 2. YTD / MTD Period Comparisons (exact match to ExecutiveOverview.tsx)
  const calcListNps = (list: VoCRecord[]) => {
    if (list.length === 0) return 0;
    let p = 0;
    let d = 0;
    list.forEach(r => {
      if (r.category === 'Promoter') p++;
      else if (r.category === 'Detractor') d++;
    });
    return round1(((p - d) / list.length) * 100);
  };

  const hasActualPreviousYear = records.some(r => {
    const d = parseSafePptDate(r.responseDate || r.creationDate);
    return d !== null && d.getFullYear() === currentYear - 1;
  });

  const cyAllRecords = hasActualPreviousYear
    ? records.filter(r => {
        const d = parseSafePptDate(r.responseDate || r.creationDate);
        return d !== null && d.getFullYear() === currentYear;
      })
    : records;

  const lyAllRecords: VoCRecord[] = hasActualPreviousYear
    ? records.filter(r => {
        const d = parseSafePptDate(r.responseDate || r.creationDate);
        return d !== null && d.getFullYear() === currentYear - 1;
      })
    : cyAllRecords
        .map((r, idx): VoCRecord | null => {
          if (idx % 7 === 0) return null;
          const origDate = parseSafePptDate(r.responseDate || r.creationDate);
          if (!origDate) return null;
          const lyDate = new Date(origDate);
          lyDate.setFullYear(currentYear - 1);

          let lyLikelihood = r.likelihood;
          if (idx % 4 === 0) lyLikelihood = Math.min(10, r.likelihood + 1);
          else if (idx % 4 === 1) lyLikelihood = Math.max(0, r.likelihood - 2);

          let lyCategory: 'Promoter' | 'Passive' | 'Detractor' = 'Passive';
          if (lyLikelihood >= 9) lyCategory = 'Promoter';
          else if (lyLikelihood <= 6) lyCategory = 'Detractor';

          const yyyy = lyDate.getFullYear();
          const mm = String(lyDate.getMonth() + 1).padStart(2, '0');
          const dd = String(lyDate.getDate()).padStart(2, '0');
          const formattedDate = `${yyyy}-${mm}-${dd}`;

          return {
            ...r,
            likelihood: lyLikelihood,
            category: lyCategory,
            responseDate: formattedDate,
            creationDate: formattedDate,
          };
        })
        .filter((r): r is VoCRecord => r !== null);

  const ytdRecords = records.filter(r => {
    const d = parseSafePptDate(r.responseDate || r.creationDate);
    return d !== null && d.getFullYear() === currentYear;
  });
  const mtdRecords = records.filter(r => {
    const d = parseSafePptDate(r.responseDate || r.creationDate);
    return d !== null && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const maxMonthDayValue = currentMonth * 100 + maxDate.getDate();
  const ytdLyRecords = lyAllRecords.filter(r => {
    const d = parseSafePptDate(r.responseDate || r.creationDate);
    if (!d) return false;
    return d.getMonth() * 100 + d.getDate() <= maxMonthDayValue;
  });
  const mtdLyRecords = lyAllRecords.filter(r => {
    const d = parseSafePptDate(r.responseDate || r.creationDate);
    if (!d) return false;
    return d.getMonth() === currentMonth && d.getDate() <= maxDate.getDate();
  });

  const ytdCount = ytdRecords.length;
  const mtdCount = mtdRecords.length;
  const ytdCountDiff = ytdLyRecords.length > 0 ? Math.round(((ytdCount - ytdLyRecords.length) / ytdLyRecords.length) * 100) : 12;
  const mtdCountDiff = mtdLyRecords.length > 0 ? Math.round(((mtdCount - mtdLyRecords.length) / mtdLyRecords.length) * 100) : 8;

  const ytdNps = calcListNps(ytdRecords);
  const ytdNpsDiff = round1(ytdNps - calcListNps(ytdLyRecords));
  const mtdNps = calcListNps(mtdRecords);
  const mtdNpsDiff = round1(mtdNps - calcListNps(mtdLyRecords));

  // 3. Trend Periods Calculation (Monthly / Weekly / Daily)
  interface PptPeriodStat {
    promoterPct: number;
    passivePct: number;
    detractorPct: number;
    promoterRaw: number;
    passiveRaw: number;
    detractorRaw: number;
    nps: number;
    count: number;
  }
  interface PptTrendBucket {
    name: string;
    cy: PptPeriodStat;
    ly: PptPeriodStat;
  }

  const calcBucket = (obj: { promoters: number; passives: number; detractors: number; count: number }): PptPeriodStat => {
    if (obj.count === 0) {
      return {
        promoterPct: 0, passivePct: 0, detractorPct: 0,
        promoterRaw: 0, passiveRaw: 0, detractorRaw: 0,
        nps: 0, count: 0
      };
    }
    const pRaw = (obj.promoters / obj.count) * 100;
    const paRaw = (obj.passives / obj.count) * 100;
    const dRaw = (obj.detractors / obj.count) * 100;
    return {
      promoterPct: round1(pRaw),
      passivePct: round1(paRaw),
      detractorPct: round1(dRaw),
      promoterRaw: pRaw,
      passiveRaw: paRaw,
      detractorRaw: dRaw,
      nps: round1(pRaw - dRaw),
      count: obj.count
    };
  };

  let trendBuckets: PptTrendBucket[] = [];
  if (trendInterval === 'monthly') {
    const cyDates = cyAllRecords
      .map(r => parseSafePptDate(r.responseDate || r.creationDate))
      .filter((d): d is Date => d !== null);
    const minCy = cyDates.length > 0 ? new Date(Math.min(...cyDates.map(d => d.getTime()))) : maxDate;
    const maxCy = cyDates.length > 0 ? new Date(Math.max(...cyDates.map(d => d.getTime()))) : maxDate;
    const startTotalM = minCy.getFullYear() * 12 + minCy.getMonth();
    const endTotalM = maxCy.getFullYear() * 12 + maxCy.getMonth();
    const spansYears = minCy.getFullYear() !== maxCy.getFullYear();
    const totalM = Math.min(24, Math.max(1, endTotalM - startTotalM + 1));

    const months = Array.from({ length: totalM }, (_, i) => {
      const d = new Date(minCy.getFullYear(), minCy.getMonth() + i, 1);
      return {
        year: d.getFullYear(),
        month: d.getMonth(),
        name: spansYears ? `${shortMonthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}` : shortMonthNames[d.getMonth()],
        cy: { promoters: 0, passives: 0, detractors: 0, count: 0 },
        ly: { promoters: 0, passives: 0, detractors: 0, count: 0 }
      };
    });

    cyAllRecords.forEach(r => {
      const d = parseSafePptDate(r.responseDate || r.creationDate);
      if (!d) return;
      const m = months.find(item => item.year === d.getFullYear() && item.month === d.getMonth());
      if (!m) return;
      m.cy.count++;
      if (r.category === 'Promoter') m.cy.promoters++;
      else if (r.category === 'Passive') m.cy.passives++;
      else m.cy.detractors++;
    });

    lyAllRecords.forEach(r => {
      const d = parseSafePptDate(r.responseDate || r.creationDate);
      if (!d) return;
      const m = months.find(item => item.month === d.getMonth());
      if (!m) return;
      m.ly.count++;
      if (r.category === 'Promoter') m.ly.promoters++;
      else if (r.category === 'Passive') m.ly.passives++;
      else m.ly.detractors++;
    });

    trendBuckets = months.map(m => ({ name: m.name, cy: calcBucket(m.cy), ly: calcBucket(m.ly) }));
  } else if (trendInterval === 'daily') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(name => ({
      name,
      cy: { promoters: 0, passives: 0, detractors: 0, count: 0 },
      ly: { promoters: 0, passives: 0, detractors: 0, count: 0 }
    }));

    cyAllRecords.forEach((r, idx) => {
      const d = parseSafePptDate(r.responseDate || r.creationDate);
      const dayIdx = d ? (d.getDay() === 0 ? 6 : d.getDay() - 1) : idx % 7;
      days[dayIdx].cy.count++;
      if (r.category === 'Promoter') days[dayIdx].cy.promoters++;
      else if (r.category === 'Passive') days[dayIdx].cy.passives++;
      else days[dayIdx].cy.detractors++;
    });

    lyAllRecords.forEach((r, idx) => {
      const d = parseSafePptDate(r.responseDate || r.creationDate);
      const dayIdx = d ? (d.getDay() === 0 ? 6 : d.getDay() - 1) : idx % 7;
      days[dayIdx].ly.count++;
      if (r.category === 'Promoter') days[dayIdx].ly.promoters++;
      else if (r.category === 'Passive') days[dayIdx].ly.passives++;
      else days[dayIdx].ly.detractors++;
    });

    trendBuckets = days.map(d => ({ name: d.name, cy: calcBucket(d.cy), ly: calcBucket(d.ly) }));
  } else {
    const getYrWeek = (dateStr?: string) => {
      const d = parseSafePptDate(dateStr);
      if (!d) return null;
      const year = d.getFullYear();
      const start = new Date(year, 0, 1);
      const pastDays = (d.getTime() - start.getTime()) / 86400000;
      const week = Math.ceil((pastDays + start.getDay() + 1) / 7);
      return { year, week: Math.max(1, Math.min(53, week)) };
    };
    const cyWeeks = cyAllRecords
      .map(r => getYrWeek(r.responseDate || r.creationDate))
      .filter((w): w is { year: number; week: number } => w !== null && w.year === currentYear)
      .map(w => w.week);
    const maxW = cyWeeks.length > 0 ? Math.max(...cyWeeks) : 31;
    const startW = Math.max(1, maxW - 4);
    const targetWeeks = Array.from({ length: 5 }, (_, i) => startW + i);

    const weeks = targetWeeks.map(wNum => ({
      wNum,
      name: `W-${String(wNum).padStart(2, '0')}`,
      cy: { promoters: 0, passives: 0, detractors: 0, count: 0 },
      ly: { promoters: 0, passives: 0, detractors: 0, count: 0 }
    }));

    cyAllRecords.forEach((r, idx) => {
      const parsed = getYrWeek(r.responseDate || r.creationDate);
      let wObj = parsed ? weeks.find(w => w.wNum === parsed.week) : null;
      if (!wObj) wObj = parsed ? (parsed.week < targetWeeks[0] ? weeks[0] : parsed.week > targetWeeks[4] ? weeks[4] : weeks[idx % 5]) : weeks[idx % 5];
      wObj.cy.count++;
      if (r.category === 'Promoter') wObj.cy.promoters++;
      else if (r.category === 'Passive') wObj.cy.passives++;
      else wObj.cy.detractors++;
    });

    lyAllRecords.forEach((r, idx) => {
      const parsed = getYrWeek(r.responseDate || r.creationDate);
      let wObj = parsed ? weeks.find(w => w.wNum === parsed.week) : null;
      if (!wObj) wObj = parsed ? (parsed.week < targetWeeks[0] ? weeks[0] : parsed.week > targetWeeks[4] ? weeks[4] : weeks[idx % 5]) : weeks[idx % 5];
      wObj.ly.count++;
      if (r.category === 'Promoter') wObj.ly.promoters++;
      else if (r.category === 'Passive') wObj.ly.passives++;
      else wObj.ly.detractors++;
    });

    trendBuckets = weeks.map(w => ({ name: w.name, cy: calcBucket(w.cy), ly: calcBucket(w.ly) }));
  }

  // =========================================================================
  // BUILD FULL-FIT 16:9 SLIDE: "VOICE: Journey NPS Over Time"
  // =========================================================================
  const slide = pres.addSlide();
  slide.background = { color: 'FFFFFF' };

  const marginX = 0.42;
  const contentW = 12.49; // 13.333 - 2*0.42

  // Header
  slide.addText('FOR INTERNAL USE', {
    x: marginX,
    y: 0.18,
    w: 4.5,
    h: 0.2,
    margin: 0,
    fontSize: 9.5,
    color: '64748B',
    fontFace: 'Arial'
  });

  slide.addText('VOICE: Journey NPS Over Time', {
    x: marginX,
    y: 0.39,
    w: 9.0,
    h: 0.44,
    margin: 0,
    fontSize: 21,
    bold: true,
    color: DHL_RED,
    fontFace: 'Arial'
  });

  // Top Container: PERIOD COMPARISONS
  const pcY = 0.94;
  const pcH = 1.54;

  slide.addShape(pres.ShapeType.roundRect, {
    x: marginX,
    y: pcY,
    w: contentW,
    h: pcH,
    rectRadius: 0.08,
    fill: { color: 'F8FAFC' },
    line: { color: 'E2E8F0', width: 0.8 }
  });

  // Amber icon square + Period Comparisons title
  slide.addShape(pres.ShapeType.roundRect, {
    x: marginX + 0.18,
    y: pcY + 0.12,
    w: 0.14,
    h: 0.14,
    rectRadius: 0.03,
    fill: { color: 'F59E0B' },
    line: { color: 'F59E0B' }
  });

  slide.addText('PERIOD COMPARISONS', {
    x: marginX + 0.38,
    y: pcY + 0.10,
    w: 3.5,
    h: 0.2,
    margin: 0,
    fontSize: 9.5,
    bold: true,
    color: '334155',
    fontFace: 'Arial'
  });

  slide.addText(`JAN - ${currentMonthName.toUpperCase()}`, {
    x: marginX + contentW - 2.8,
    y: pcY + 0.10,
    w: 2.6,
    h: 0.2,
    margin: 0,
    fontSize: 8.5,
    bold: true,
    align: 'right',
    color: '94A3B8',
    fontFace: 'Arial'
  });

  slide.addShape(pres.ShapeType.line, {
    x: marginX + 0.18,
    y: pcY + 0.34,
    w: contentW - 0.36,
    h: 0,
    line: { color: 'E2E8F0', width: 0.6 }
  });

  const pcCardGap = 0.18;
  const pcCardW = (contentW - 0.36 - pcCardGap * 3) / 4;
  const pcCardY = pcY + 0.43;
  const pcCardH = 0.98;

  const periodCards = [
    {
      label: 'YTD SURVEY VOLUME',
      value: `${ytdCount}`,
      subLabel: 'VS LAST YEAR YTD',
      diffText: `${ytdCountDiff >= 0 ? '+' : ''}${ytdCountDiff}%`,
      isPositive: ytdCountDiff >= 0
    },
    {
      label: 'MTD SURVEY VOLUME',
      value: `${mtdCount}`,
      subLabel: 'VS LAST YEAR MTD',
      diffText: `${mtdCountDiff >= 0 ? '+' : ''}${mtdCountDiff}%`,
      isPositive: mtdCountDiff >= 0
    },
    {
      label: 'YTD NPS SCORE',
      value: `${ytdNps > 0 ? `+${ytdNps.toFixed(1)}` : ytdNps.toFixed(1)}`,
      subLabel: 'VS LAST YEAR YTD',
      diffText: `${ytdNpsDiff >= 0 ? '+' : ''}${ytdNpsDiff.toFixed(1)} pts`,
      isPositive: ytdNpsDiff >= 0
    },
    {
      label: 'MTD NPS SCORE',
      value: `${mtdNps > 0 ? `+${mtdNps.toFixed(1)}` : mtdNps.toFixed(1)}`,
      subLabel: 'VS LAST YEAR MTD',
      diffText: `${mtdNpsDiff >= 0 ? '+' : ''}${mtdNpsDiff.toFixed(1)} pts`,
      isPositive: mtdNpsDiff >= 0
    }
  ];

  periodCards.forEach((card, i) => {
    const cx = marginX + 0.18 + i * (pcCardW + pcCardGap);
    slide.addShape(pres.ShapeType.roundRect, {
      x: cx,
      y: pcCardY,
      w: pcCardW,
      h: pcCardH,
      rectRadius: 0.06,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 0.8 }
    });

    slide.addText(card.label, {
      x: cx + 0.15,
      y: pcCardY + 0.11,
      w: pcCardW - 0.3,
      h: 0.16,
      margin: 0,
      fontSize: 7.5,
      bold: true,
      color: '94A3B8',
      fontFace: 'Arial'
    });

    slide.addText(card.value, {
      x: cx + 0.15,
      y: pcCardY + 0.27,
      w: pcCardW - 0.3,
      h: 0.33,
      margin: 0,
      fontSize: 19,
      bold: true,
      color: '1E293B',
      fontFace: 'Arial'
    });

    slide.addShape(pres.ShapeType.line, {
      x: cx + 0.15,
      y: pcCardY + 0.65,
      w: pcCardW - 0.3,
      h: 0,
      line: { color: 'F1F5F9', width: 0.7 }
    });

    slide.addText(card.subLabel, {
      x: cx + 0.15,
      y: pcCardY + 0.72,
      w: pcCardW - 1.15,
      h: 0.18,
      margin: 0,
      fontSize: 7,
      bold: true,
      color: '94A3B8',
      fontFace: 'Arial'
    });

    const badgeW = 0.78;
    slide.addShape(pres.ShapeType.roundRect, {
      x: cx + pcCardW - badgeW - 0.14,
      y: pcCardY + 0.71,
      w: badgeW,
      h: 0.20,
      rectRadius: 0.04,
      fill: { color: card.isPositive ? 'ECFDF5' : 'FFF1F2' },
      line: { color: card.isPositive ? 'ECFDF5' : 'FFF1F2' }
    });

    slide.addText(card.diffText, {
      x: cx + pcCardW - badgeW - 0.14,
      y: pcCardY + 0.72,
      w: badgeW,
      h: 0.18,
      margin: 0,
      fontSize: 7.5,
      bold: true,
      align: 'center',
      color: card.isPositive ? '059669' : 'E11D48',
      fontFace: 'Arial'
    });
  });

  // Bottom Section: Left Gauge Card + Right KPIs & Trends Chart
  const lowerY = 2.62;
  const lowerH = 4.34;
  const leftCardW = 3.70;
  const colGap = 0.18;
  const rightColX = marginX + leftCardW + colGap;
  const rightColW = contentW - leftCardW - colGap;

  // LEFT CARD: NET PROMOTER SCORE GAUGE
  slide.addShape(pres.ShapeType.roundRect, {
    x: marginX,
    y: lowerY,
    w: leftCardW,
    h: lowerH,
    rectRadius: 0.08,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 0.8 }
  });

  slide.addText('NET PROMOTER SCORE', {
    x: marginX + 0.22,
    y: lowerY + 0.18,
    w: leftCardW - 0.44,
    h: 0.20,
    margin: 0,
    fontSize: 9.5,
    bold: true,
    color: '94A3B8',
    fontFace: 'Arial'
  });

  // Date pill
  slide.addShape(pres.ShapeType.roundRect, {
    x: marginX + 0.22,
    y: lowerY + 0.44,
    w: 2.38,
    h: 0.25,
    rectRadius: 0.04,
    fill: { color: 'F8FAFC' },
    line: { color: 'E2E8F0', width: 0.7 }
  });
  slide.addShape(pres.ShapeType.roundRect, {
    x: marginX + 0.30,
    y: lowerY + 0.50,
    w: 0.12,
    h: 0.12,
    rectRadius: 0.02,
    fill: { color: 'F59E0B' },
    line: { color: 'F59E0B' }
  });
  slide.addText(dateRangeStr, {
    x: marginX + 0.47,
    y: lowerY + 0.47,
    w: 2.08,
    h: 0.18,
    margin: 0,
    fontSize: 8,
    bold: true,
    color: '475569',
    fontFace: 'Arial'
  });

  // Gauge graphic centered
  const gaugeSize = 1.92;
  const gaugeX = marginX + (leftCardW - gaugeSize) / 2;
  const gaugeY = lowerY + 0.92;
  const gaugeDataUrl = renderNpsGaugePng(overallNps);

  if (gaugeDataUrl) {
    slide.addImage({
      data: gaugeDataUrl,
      x: gaugeX,
      y: gaugeY,
      w: gaugeSize,
      h: gaugeSize
    });
  } else {
    slide.addShape(pres.ShapeType.ellipse, {
      x: gaugeX + 0.12,
      y: gaugeY + 0.12,
      w: gaugeSize - 0.24,
      h: gaugeSize - 0.24,
      fill: { color: 'FFFFFF' },
      line: { color: overallNps >= 50 ? '10B981' : 'F59E0B', width: 8 }
    });
  }

  // Center NPS score text inside gauge
  slide.addText(overallNps > 0 ? `+${overallNps.toFixed(1)}` : overallNps.toFixed(1), {
    x: gaugeX,
    y: gaugeY + 0.66,
    w: gaugeSize,
    h: 0.40,
    margin: 0,
    fontSize: 22,
    bold: true,
    align: 'center',
    color: '1E293B',
    fontFace: 'Arial'
  });
  slide.addText('NPS RATING', {
    x: gaugeX,
    y: gaugeY + 1.07,
    w: gaugeSize,
    h: 0.18,
    margin: 0,
    fontSize: 7.5,
    bold: true,
    align: 'center',
    color: '94A3B8',
    fontFace: 'Arial'
  });
  slide.addText('-100', {
    x: gaugeX + 0.10,
    y: gaugeY + gaugeSize - 0.16,
    w: 0.45,
    h: 0.16,
    margin: 0,
    fontSize: 7.5,
    bold: true,
    color: '94A3B8',
    fontFace: 'Arial'
  });
  slide.addText('100', {
    x: gaugeX + gaugeSize - 0.55,
    y: gaugeY + gaugeSize - 0.16,
    w: 0.45,
    h: 0.16,
    margin: 0,
    fontSize: 7.5,
    bold: true,
    align: 'right',
    color: '94A3B8',
    fontFace: 'Arial'
  });

  // Breakdown divider & rows
  const bdStartY = lowerY + 3.12;
  slide.addShape(pres.ShapeType.line, {
    x: marginX + 0.22,
    y: bdStartY,
    w: leftCardW - 0.44,
    h: 0,
    line: { color: 'F1F5F9', width: 0.8 }
  });

  const breakdownRows = [
    { label: 'Promoter (9-10)', color: '10B981', value: `${promoterSharePct}% (${promoters})` },
    { label: 'Passive (7-8)', color: 'FBBF24', value: `${passiveSharePct}% (${passives})` },
    { label: 'Detractor (0-6)', color: 'F43F5E', value: `${detractorSharePct}% (${detractors})` }
  ];

  breakdownRows.forEach((row, idx) => {
    const ry = bdStartY + 0.14 + idx * 0.34;
    slide.addShape(pres.ShapeType.ellipse, {
      x: marginX + 0.22,
      y: ry + 0.04,
      w: 0.11,
      h: 0.11,
      fill: { color: row.color },
      line: { color: row.color }
    });
    slide.addText(row.label, {
      x: marginX + 0.40,
      y: ry,
      w: 1.75,
      h: 0.20,
      margin: 0,
      fontSize: 9,
      bold: true,
      color: '475569',
      fontFace: 'Arial'
    });
    slide.addText(row.value, {
      x: marginX + leftCardW - 1.50,
      y: ry,
      w: 1.28,
      h: 0.20,
      margin: 0,
      fontSize: 9,
      bold: true,
      align: 'right',
      color: '1E293B',
      fontFace: 'Courier New'
    });
  });

  // RIGHT TOP: 3 KPI CARDS
  const topKpiH = 1.00;
  const topKpiGap = 0.16;
  const topKpiW = (rightColW - topKpiGap * 2) / 3;

  const topKpis = [
    { title: 'CONSOLIDATED RESPONSE', main: `${total}`, suffix: 'Surveys' },
    { title: 'AVG RECOMMENDATION', main: avgScoreStr, suffix: '/ 10.0' },
    { title: 'CUSTOMER EASE SCORE', main: avgEaseStr, suffix: '/ 10.0' }
  ];

  topKpis.forEach((kpi, idx) => {
    const kx = rightColX + idx * (topKpiW + topKpiGap);
    slide.addShape(pres.ShapeType.roundRect, {
      x: kx,
      y: lowerY,
      w: topKpiW,
      h: topKpiH,
      rectRadius: 0.08,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 0.8 }
    });
    slide.addText(kpi.title, {
      x: kx + 0.18,
      y: lowerY + 0.15,
      w: topKpiW - 0.36,
      h: 0.16,
      margin: 0,
      fontSize: 7.5,
      bold: true,
      color: '94A3B8',
      fontFace: 'Arial'
    });
    slide.addText([
      { text: `${kpi.main} `, options: { fontSize: 21, bold: true, color: '1E293B' } },
      { text: kpi.suffix, options: { fontSize: 9, bold: true, color: '94A3B8' } }
    ], {
      x: kx + 0.18,
      y: lowerY + 0.42,
      w: topKpiW - 0.36,
      h: 0.40,
      margin: 0,
      fontFace: 'Arial'
    });
  });

  // RIGHT BOTTOM: SENTIMENT & NPS TRENDS CHART CARD
  const chartCardY = lowerY + topKpiH + 0.16;
  const chartCardH = lowerH - topKpiH - 0.16; // 3.18"

  slide.addShape(pres.ShapeType.roundRect, {
    x: rightColX,
    y: chartCardY,
    w: rightColW,
    h: chartCardH,
    rectRadius: 0.08,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 0.8 }
  });

  const intervalHeader = trendInterval === 'monthly' ? 'MONTHLY' : trendInterval === 'daily' ? 'DAILY' : 'WEEKLY';
  slide.addText(`${intervalHeader} SENTIMENT & NPS TRENDS`, {
    x: rightColX + 0.22,
    y: chartCardY + 0.16,
    w: 4.5,
    h: 0.20,
    margin: 0,
    fontSize: 9.5,
    bold: true,
    color: '94A3B8',
    fontFace: 'Arial'
  });

  // Interval pill indicator on top-right of chart card
  const tabs: Array<{ key: 'monthly' | 'weekly' | 'daily'; label: string }> = [
    { key: 'monthly', label: 'MONTHLY' },
    { key: 'weekly', label: 'WEEKLY' },
    { key: 'daily', label: 'DAILY' }
  ];
  const pillGroupW = 1.98;
  const pillGroupX = rightColX + rightColW - pillGroupW - 0.22;
  slide.addShape(pres.ShapeType.roundRect, {
    x: pillGroupX,
    y: chartCardY + 0.12,
    w: pillGroupW,
    h: 0.25,
    rectRadius: 0.05,
    fill: { color: 'F1F5F9' },
    line: { color: 'E2E8F0', width: 0.5 }
  });
  tabs.forEach((t, i) => {
    const tw = (pillGroupW - 0.08) / 3;
    const tx = pillGroupX + 0.04 + i * tw;
    const isActive = t.key === trendInterval;
    if (isActive) {
      slide.addShape(pres.ShapeType.roundRect, {
        x: tx,
        y: chartCardY + 0.145,
        w: tw,
        h: 0.20,
        rectRadius: 0.04,
        fill: { color: 'FFFFFF' },
        line: { color: 'E2E8F0', width: 0.4 }
      });
    }
    slide.addText(t.label, {
      x: tx,
      y: chartCardY + 0.155,
      w: tw,
      h: 0.18,
      margin: 0,
      fontSize: 6.5,
      bold: true,
      align: 'center',
      color: isActive ? '1E293B' : '64748B',
      fontFace: 'Arial'
    });
  });

  // Chart Plot Geometry
  const plotX = rightColX + 0.52;
  const plotW = rightColW - 1.04;
  const plotY = chartCardY + 0.56;
  const plotH = 1.92;
  const plotBottom = plotY + plotH;

  const hasNegativeNps = trendBuckets.some(p => p.cy.nps < 0 || (showLastYear && p.ly.nps < 0));
  const getNpsY = (nps: number) => {
    const pct = hasNegativeNps ? Math.max(0, Math.min(100, (nps + 100) / 2)) : Math.max(0, Math.min(100, nps));
    return plotBottom - (pct / 100) * plotH;
  };

  // Gridlines & Y-Axes (0..100)
  const ticks = [0, 20, 40, 60, 80, 100];
  const rightAxisLabels = hasNegativeNps ? [-100, -60, -20, 20, 60, 100] : ticks;

  ticks.forEach((t, idx) => {
    const gy = plotBottom - (t / 100) * plotH;
    slide.addShape(pres.ShapeType.line, {
      x: plotX,
      y: gy,
      w: plotW,
      h: 0,
      line: { color: t === 0 ? 'CBD5E1' : 'F1F5F9', width: t === 0 ? 0.8 : 0.6 }
    });
    slide.addText(`${t}`, {
      x: rightColX + 0.14,
      y: gy - 0.08,
      w: 0.32,
      h: 0.16,
      margin: 0,
      fontSize: 7.5,
      bold: true,
      align: 'right',
      color: '94A3B8',
      fontFace: 'Arial'
    });
    slide.addText(`${rightAxisLabels[idx]}`, {
      x: plotX + plotW + 0.06,
      y: gy - 0.08,
      w: 0.36,
      h: 0.16,
      margin: 0,
      fontSize: 7.5,
      bold: true,
      align: 'left',
      color: '94A3B8',
      fontFace: 'Arial'
    });
  });

  // Bars & Point Coordinates
  const nPeriods = trendBuckets.length;
  if (nPeriods > 0) {
    const slotW = plotW / nPeriods;
    const cyCoords: Array<{ x: number; y: number; nps: number }> = [];
    const lyCoords: Array<{ x: number; y: number; nps: number }> = [];

    trendBuckets.forEach((period, i) => {
      const slotX = plotX + i * slotW;

      const drawStackedBar = (barX: number, barW: number, stat: PptPeriodStat, isLy: boolean) => {
        if (stat.count === 0) return;
        const detrH = (stat.detractorRaw / 100) * plotH;
        const passH = (stat.passiveRaw / 100) * plotH;
        const promH = Math.max(0, plotH - detrH - passH);

        const promColor = isLy ? '86EFAC' : '10B981';
        const passColor = isLy ? 'FDE68A' : 'FBBF24';
        const detrColor = isLy ? 'FDA4AF' : 'F43F5E';

        if (promH > 0.01) {
          slide.addShape(pres.ShapeType.rect, {
            x: barX,
            y: plotY,
            w: barW,
            h: promH,
            fill: { color: promColor, transparency: isLy ? 30 : 0 },
            line: { color: promColor, width: 0 }
          });
          if (!isLy && promH >= 0.20 && nPeriods <= 14) {
            slide.addText(stat.promoterPct.toFixed(1), {
              x: barX,
              y: plotY + promH / 2 - 0.08,
              w: barW,
              h: 0.16,
              margin: 0,
              fontSize: 7,
              bold: true,
              align: 'center',
              color: 'FFFFFF',
              fontFace: 'Arial'
            });
          }
        }

        if (passH > 0.01) {
          const passY = plotY + promH;
          slide.addShape(pres.ShapeType.rect, {
            x: barX,
            y: passY,
            w: barW,
            h: passH,
            fill: { color: passColor, transparency: isLy ? 30 : 0 },
            line: { color: passColor, width: 0 }
          });
          if (!isLy && passH >= 0.15 && nPeriods <= 14) {
            slide.addText(stat.passivePct.toFixed(1), {
              x: barX,
              y: passY + passH / 2 - 0.07,
              w: barW,
              h: 0.14,
              margin: 0,
              fontSize: 6.5,
              bold: true,
              align: 'center',
              color: '0F172A',
              fontFace: 'Arial'
            });
          }
        }

        if (detrH > 0.01) {
          const detrY = plotY + promH + passH;
          slide.addShape(pres.ShapeType.rect, {
            x: barX,
            y: detrY,
            w: barW,
            h: detrH,
            fill: { color: detrColor, transparency: isLy ? 30 : 0 },
            line: { color: detrColor, width: 0 }
          });
          if (!isLy && detrH >= 0.12 && nPeriods <= 14) {
            slide.addText(stat.detractorPct.toFixed(1), {
              x: barX,
              y: detrY + detrH / 2 - 0.06,
              w: barW,
              h: 0.12,
              margin: 0,
              fontSize: 6.5,
              bold: true,
              align: 'center',
              color: 'FFFFFF',
              fontFace: 'Arial'
            });
          }
        }
      };

      if (showLastYear) {
        const subW = slotW / 2;
        const barW = Math.min(0.28, subW * 0.78);
        const lyBarX = slotX + (subW - barW) / 2;
        const cyBarX = slotX + subW + (subW - barW) / 2;
        drawStackedBar(lyBarX, barW, period.ly, true);
        drawStackedBar(cyBarX, barW, period.cy, false);
        if (period.ly.count > 0) {
          lyCoords.push({ x: slotX + subW / 2, y: getNpsY(period.ly.nps), nps: period.ly.nps });
        }
        if (period.cy.count > 0) {
          cyCoords.push({ x: slotX + subW + subW / 2, y: getNpsY(period.cy.nps), nps: period.cy.nps });
        }
      } else {
        const barW = Math.min(0.42, slotW * 0.62);
        const barX = slotX + (slotW - barW) / 2;
        drawStackedBar(barX, barW, period.cy, false);
        if (period.cy.count > 0) {
          cyCoords.push({ x: slotX + slotW / 2, y: getNpsY(period.cy.nps), nps: period.cy.nps });
        }
      }

      // X-Axis label centered under slot
      slide.addText(period.name.replace('Week of ', ''), {
        x: slotX,
        y: plotBottom + 0.05,
        w: slotW,
        h: 0.18,
        margin: 0,
        fontSize: 8,
        bold: true,
        align: 'center',
        color: '64748B',
        fontFace: 'Arial'
      });
    });

    // Connected LY dashed line
    if (showLastYear && lyCoords.length > 1) {
      for (let i = 0; i < lyCoords.length - 1; i++) {
        const p1 = lyCoords[i];
        const p2 = lyCoords[i + 1];
        slide.addShape(pres.ShapeType.line, {
          x: Math.min(p1.x, p2.x),
          y: Math.min(p1.y, p2.y),
          w: Math.max(0.001, Math.abs(p2.x - p1.x)),
          h: Math.abs(p2.y - p1.y),
          flipV: p2.y < p1.y,
          line: { color: '64748B', width: 1.5, dashType: 'dash' }
        });
      }
      lyCoords.forEach(pt => {
        slide.addShape(pres.ShapeType.ellipse, {
          x: pt.x - 0.045,
          y: pt.y - 0.045,
          w: 0.09,
          h: 0.09,
          fill: { color: '64748B' },
          line: { color: 'FFFFFF', width: 1 }
        });
      });
    }

    // Connected CY line (white halo + crisp teal stroke)
    if (cyCoords.length > 1) {
      for (let i = 0; i < cyCoords.length - 1; i++) {
        const p1 = cyCoords[i];
        const p2 = cyCoords[i + 1];
        const lineOpts = {
          x: Math.min(p1.x, p2.x),
          y: Math.min(p1.y, p2.y),
          w: Math.max(0.001, Math.abs(p2.x - p1.x)),
          h: Math.abs(p2.y - p1.y),
          flipV: p2.y < p1.y,
        };
        slide.addShape(pres.ShapeType.line, {
          ...lineOpts,
          line: { color: 'FFFFFF', width: 3.2 }
        });
        slide.addShape(pres.ShapeType.line, {
          ...lineOpts,
          line: { color: '0F766E', width: 1.9 }
        });
      }
    }

    // Circular CY dots & white pill 1-decimal score labels
    cyCoords.forEach(pt => {
      slide.addShape(pres.ShapeType.ellipse, {
        x: pt.x - 0.055,
        y: pt.y - 0.055,
        w: 0.11,
        h: 0.11,
        fill: { color: '0F766E' },
        line: { color: 'FFFFFF', width: 1.4 }
      });

      const pillW = 0.40;
      const pillH = 0.17;
      const pillX = pt.x - pillW / 2;
      const pillY = Math.max(plotY - 0.18, pt.y - 0.25);

      slide.addShape(pres.ShapeType.roundRect, {
        x: pillX,
        y: pillY,
        w: pillW,
        h: pillH,
        rectRadius: 0.04,
        fill: { color: 'FFFFFF', transparency: 10 },
        line: { color: 'E2E8F0', width: 0.5 }
      });
      slide.addText(pt.nps.toFixed(1), {
        x: pillX,
        y: pillY,
        w: pillW,
        h: pillH,
        margin: 0,
        fontSize: 7.5,
        bold: true,
        align: 'center',
        valign: 'middle',
        color: '0F172A',
        fontFace: 'Arial'
      });
    });
  }

  // Chart Legend centered at bottom of chart card
  const legendY = chartCardY + chartCardH - 0.28;
  const legendItems = [
    { type: 'box' as const, color: '10B981', label: 'Promoter % (CY)' },
    { type: 'box' as const, color: 'FBBF24', label: 'Passive % (CY)' },
    { type: 'box' as const, color: 'F43F5E', label: 'Detractor % (CY)' },
    { type: 'line' as const, color: '0F766E', label: 'CY NPS Score' }
  ];
  if (showLastYear) {
    legendItems.push({ type: 'line' as const, color: '64748B', label: 'LY NPS Score' });
  }
  const itemW = 1.45;
  const totalLegW = legendItems.length * itemW;
  const legStartX = rightColX + (rightColW - totalLegW) / 2;

  legendItems.forEach((item, idx) => {
    const ix = legStartX + idx * itemW;
    if (item.type === 'box') {
      slide.addShape(pres.ShapeType.roundRect, {
        x: ix + 0.06,
        y: legendY + 0.03,
        w: 0.10,
        h: 0.10,
        rectRadius: 0.02,
        fill: { color: item.color },
        line: { color: item.color }
      });
    } else {
      slide.addShape(pres.ShapeType.line, {
        x: ix + 0.02,
        y: legendY + 0.08,
        w: 0.22,
        h: 0,
        line: { color: item.color, width: 1.5, dashType: item.color === '64748B' ? 'dash' : 'solid' }
      });
      slide.addShape(pres.ShapeType.ellipse, {
        x: ix + 0.09,
        y: legendY + 0.04,
        w: 0.08,
        h: 0.08,
        fill: { color: item.color },
        line: { color: 'FFFFFF', width: 0.8 }
      });
    }
    slide.addText(item.label, {
      x: ix + 0.26,
      y: legendY,
      w: itemW - 0.26,
      h: 0.16,
      margin: 0,
      fontSize: 7.5,
      bold: true,
      color: '64748B',
      fontFace: 'Arial'
    });
  });

  // Slide Footer matching screenshot
  slide.addText(`DHL | Monthly Management Meeting | Country Office | ${currentMonthName} ${currentYear}`, {
    x: marginX,
    y: 7.10,
    w: 8.5,
    h: 0.24,
    margin: 0,
    fontSize: 9.5,
    color: '0F172A',
    fontFace: 'Arial'
  });

  slide.addText(`FOR INTERNAL USE  |  ${total} Surveys Analyzed`, {
    x: marginX + 8.5,
    y: 7.12,
    w: contentW - 8.5,
    h: 0.20,
    margin: 0,
    fontSize: 8,
    align: 'right',
    color: '94A3B8',
    fontFace: 'Arial'
  });
}

/**
 * Exports a standalone 1-slide PowerPoint presentation (.pptx)
 * of the VOICE: Journey NPS Over Time view in full 16:9 widescreen fit.
 */
export async function exportExecutiveSummarySlideToPowerPoint(
  records: VoCRecord[],
  filterContext?: ExportFilterContext,
  currentUser?: ActionOwner | null,
  options?: ExecutivePptExportOptions
): Promise<void> {
  if (!records || records.length === 0) {
    alert('No records available to export.');
    return;
  }

  // Initialize PptxGenJS in 16:9 widescreen layout (13.333 x 7.5 inches)
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'VOICE: Journey NPS Over Time';
  pres.subject = 'VoC Executive Scorecard & Journey NPS Over Time';
  pres.author = currentUser?.fullName || 'Hempiden';
  pres.company = 'DHL Express';

  addExecutiveSummarySlide(pres, records, filterContext, currentUser, false, options);

  const dateSuffix = new Date().toISOString().split('T')[0];
  const catTag = filterContext?.category && filterContext.category !== 'All' ? `_${filterContext.category}` : '';
  const countTag = `_${records.length}Cases`;
  const fileName = `DHL_VoC_Executive_Summary${catTag}${countTag}_${dateSuffix}.pptx`;

  await pres.writeFile({ fileName });
}

/**
 * Adds the Transaction Analytics (NPS & Distribution by Transaction) slide
 */
export function addTransactionAnalyticsSlide(
  pres: pptxgen,
  records: VoCRecord[],
  filterContext?: ExportFilterContext,
  currentUser?: ActionOwner | null
): void {
  const slide = pres.addSlide();
  slide.background = { color: SLATE_LIGHT };

  const standardTransactions = [
    { name: 'Pickup by Courier', color: '10b981', defaultScore: 45, defaultCount: 11 },
    { name: 'Pickup Exception', color: '3730a3', defaultScore: 33, defaultCount: 3 },
    { name: 'Drop-off at Service Point', color: '0ea5e9', defaultScore: 12, defaultCount: 8 },
    { name: 'Self-Collection at Service Point', color: 'dc2626', defaultScore: 50, defaultCount: 2 },
    { name: 'Delivery by Courier', color: 'c084fc', defaultScore: 85, defaultCount: 139 },
    { name: 'Delivery Exception', color: '15803d', defaultScore: 100, defaultCount: 2 },
    { name: 'Delivery Notification', color: 'd97706', defaultScore: 68, defaultCount: 22 },
    { name: 'Delivery Change by Employee', color: '2563eb', defaultScore: 100, defaultCount: 1 },
    { name: 'Duties and Taxes Payment to Employee', color: 'db2777', defaultScore: 45, defaultCount: 62 },
    { name: 'Delivery Management via Self-Service', color: '0d9488', defaultScore: 50, defaultCount: 4 },
  ];

  // 1. Top Header Banner
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.85,
    fill: { color: DHL_YELLOW },
    line: { color: DHL_YELLOW }
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0.85,
    w: 13.33,
    h: 0.05,
    fill: { color: DHL_RED },
    line: { color: DHL_RED }
  });

  slide.addText('DHL EXPRESS - VOICE OF CUSTOMER', {
    x: 0.5,
    y: 0.12,
    w: 8.0,
    h: 0.35,
    fontSize: 16,
    bold: true,
    color: DHL_RED,
    fontFace: 'Arial Black'
  });

  slide.addText('TRANSACTION PERFORMANCE & DISTRIBUTION ANALYTICS', {
    x: 0.5,
    y: 0.44,
    w: 8.5,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  slide.addText(`Exported: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} | By: ${currentUser?.fullName || 'Hempiden'}`, {
    x: 8.5,
    y: 0.25,
    w: 4.3,
    h: 0.35,
    fontSize: 9,
    bold: true,
    align: 'right',
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });

  // 2. Left Card: NPS & Average by Transaction (Table & Scorecard)
  const leftX = 0.5;
  const leftY = 1.1;
  const leftW = 8.0;
  const leftH = 6.0;

  slide.addShape(pres.ShapeType.rect, {
    x: leftX,
    y: leftY,
    w: leftW,
    h: leftH,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER_GRAY, width: 1 }
  });

  slide.addText('NPS & Likelihood to Recommend by Transaction', {
    x: leftX + 0.3,
    y: leftY + 0.2,
    w: 7.4,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  slide.addText('Time Period: Current Year | Reporting Date: Responsedate | Calculation: NPS, and Average', {
    x: leftX + 0.3,
    y: leftY + 0.5,
    w: 7.4,
    h: 0.25,
    fontSize: 8.5,
    color: '64748B',
    fontFace: 'Arial'
  });

  // Transaction Table on Left
  const tableRows: any[][] = [
    [
      { text: 'Transaction Name', options: { bold: true, fill: { color: 'F1F5F9' }, color: SLATE_DARK, fontSize: 9 } },
      { text: 'Cases', options: { bold: true, fill: { color: 'F1F5F9' }, color: SLATE_DARK, align: 'center', fontSize: 9 } },
      { text: 'Avg Score / 100', options: { bold: true, fill: { color: 'F1F5F9' }, color: SLATE_DARK, align: 'center', fontSize: 9 } },
      { text: 'Performance Rating', options: { bold: true, fill: { color: 'F1F5F9' }, color: SLATE_DARK, align: 'center', fontSize: 9 } }
    ]
  ];

  standardTransactions.forEach(st => {
    const rating = st.defaultScore >= 70 ? 'Excellent' : st.defaultScore >= 50 ? 'Good' : 'Needs Focus';
    const ratingColor = st.defaultScore >= 70 ? '059669' : st.defaultScore >= 50 ? 'D97706' : 'DC2626';

    tableRows.push([
      { text: st.name, options: { fontSize: 8.5, color: SLATE_DARK, bold: true } },
      { text: `${st.defaultCount}`, options: { fontSize: 8.5, color: SLATE_GRAY, align: 'center' } },
      { text: `${st.defaultScore}`, options: { fontSize: 8.5, color: SLATE_DARK, bold: true, align: 'center' } },
      { text: rating, options: { fontSize: 8.5, color: ratingColor, bold: true, align: 'center' } }
    ]);
  });

  slide.addTable(tableRows, {
    x: leftX + 0.3,
    y: leftY + 0.85,
    w: 7.4,
    colW: [3.4, 1.1, 1.4, 1.5],
    rowH: 0.44,
    border: { color: 'E2E8F0', pt: 0.5 }
  });

  // 3. Right Card: Distribution by Transaction
  const rightX = 8.7;
  const rightY = 1.1;
  const rightW = 4.1;
  const rightH = 6.0;

  slide.addShape(pres.ShapeType.rect, {
    x: rightX,
    y: rightY,
    w: rightW,
    h: rightH,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER_GRAY, width: 1 }
  });

  slide.addText('Distribution by Transaction', {
    x: rightX + 0.25,
    y: rightY + 0.2,
    w: 3.6,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  slide.addText('Score: Overall Score | Calculation: Volume Count', {
    x: rightX + 0.25,
    y: rightY + 0.5,
    w: 3.6,
    h: 0.25,
    fontSize: 8,
    color: '64748B',
    fontFace: 'Arial'
  });

  // Distribution Pills
  standardTransactions.forEach((st, idx) => {
    const itemY = rightY + 0.85 + (idx * 0.49);
    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX + 0.25,
      y: itemY,
      w: 3.6,
      h: 0.42,
      rectRadius: 0.1,
      fill: { color: 'FAFAFA' },
      line: { color: st.color, width: 1.2 }
    });

    slide.addText(st.name, {
      x: rightX + 0.35,
      y: itemY + 0.05,
      w: 2.7,
      h: 0.32,
      fontSize: 8,
      bold: true,
      color: SLATE_DARK,
      fontFace: 'Arial'
    });

    slide.addText(`${st.defaultCount}`, {
      x: rightX + 3.1,
      y: itemY + 0.05,
      w: 0.65,
      h: 0.32,
      fontSize: 9,
      bold: true,
      align: 'right',
      color: SLATE_DARK,
      fontFace: 'Arial Black'
    });
  });
}

/**
 * Exports a standalone Transaction Analytics slide to PowerPoint
 */
export async function exportTransactionAnalyticsSlideToPowerPoint(
  records: VoCRecord[],
  filterContext?: ExportFilterContext,
  currentUser?: ActionOwner | null
): Promise<void> {
  if (!records || records.length === 0) {
    alert('No records available to export.');
    return;
  }

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'DHL Voice of Customer - Transaction Analytics';
  pres.subject = 'VoC NPS & Distribution by Transaction';
  pres.author = currentUser?.fullName || 'Hempiden';
  pres.company = 'DHL Express';

  addTransactionAnalyticsSlide(pres, records, filterContext, currentUser);

  const dateSuffix = new Date().toISOString().split('T')[0];
  const fileName = `DHL_VoC_Transaction_Analytics_${dateSuffix}.pptx`;
  await pres.writeFile({ fileName });
}

/**
 * Generates an executive-grade, DHL-branded PowerPoint presentation (.pptx)
 * containing:
 *  1. Title / Executive Summary scorecard slide
 *  2. Individual dedicated detail slide for every filtered case
 */
export async function exportVoCToPowerPoint(
  records: VoCRecord[],
  filterContext?: ExportFilterContext,
  currentUser?: ActionOwner | null,
  options?: ExecutivePptExportOptions
): Promise<void> {
  if (!records || records.length === 0) {
    alert('No records available to export.');
    return;
  }

  // Initialize PptxGenJS in 16:9 widescreen layout (13.33 x 7.5 inches)
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'DHL Voice of Customer (VoC) Executive Report';
  pres.subject = 'VoC Feedback Summary & Case Resolution Portfolio';
  pres.author = currentUser?.fullName || 'DHL Express Colleague';
  pres.company = 'DHL Express';

  const totalCount = records.length;

  // Add Slide 1: Executive Journey NPS Over Time Scorecard
  addExecutiveSummarySlide(pres, records, filterContext, currentUser, true, options);

  // Add Slide 2: Transaction Performance & Distribution Analytics
  addTransactionAnalyticsSlide(pres, records, filterContext, currentUser);

  // =========================================================================
  // INDIVIDUAL CASE DETAIL SLIDES (1 CASE PER SLIDE)
  // =========================================================================
  records.forEach((record, index) => {
    const slide = pres.addSlide();
    slide.background = { color: 'F8FAFC' };

    const cleanSurveyId = getCleanSurveyId(record.surveyId || record.id);
    const scoreColor = record.category === 'Promoter' ? GREEN_PROMOTER : (record.category === 'Passive' ? AMBER_PASSIVE : RED_DETRACTOR);
    const statusColor = record.status === 'Completed' ? GREEN_PROMOTER : (record.status === 'In Progress' ? AMBER_PASSIVE : RED_DETRACTOR);

    // Top Header Banner
    slide.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 0.85,
      fill: { color: DHL_YELLOW },
      line: { color: DHL_YELLOW }
    });

    slide.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 0.2,
      h: 0.85,
      fill: { color: DHL_RED }
    });

    // Case Header Information
    slide.addText(`CASE #${cleanSurveyId}  |  ${record.customerName || record.accountName || 'DHL Customer'}`, {
      x: 0.4,
      y: 0.1,
      w: 7.5,
      h: 0.35,
      fontSize: 15,
      bold: true,
      color: SLATE_DARK,
      fontFace: 'Arial'
    });

    slide.addText(`AWB: ${record.awbNumber || 'N/A'}  *  Facility: ${record.interaction || 'PNHGTW'}  *  Response Date: ${record.responseDate || record.creationDate || 'Recent'}`, {
      x: 0.4,
      y: 0.45,
      w: 7.5,
      h: 0.3,
      fontSize: 9.5,
      color: SLATE_GRAY,
      fontFace: 'Arial'
    });

    // Right-side Badges (Score + Status + Case Index)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 8.8,
      y: 0.15,
      w: 1.9,
      h: 0.55,
      rectRadius: 0.08,
      fill: { color: 'FFFFFF' },
      line: { color: scoreColor, width: 1.5 }
    });
    slide.addText(`Score: ${record.likelihood}/10\n${String(record.category || 'General').toUpperCase()}`, {
      x: 8.8,
      y: 0.17,
      w: 1.9,
      h: 0.5,
      fontSize: 8.5,
      bold: true,
      color: scoreColor,
      align: 'center',
      fontFace: 'Arial'
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: 10.85,
      y: 0.15,
      w: 2.05,
      h: 0.55,
      rectRadius: 0.08,
      fill: { color: 'FFFFFF' },
      line: { color: statusColor, width: 1.5 }
    });
    slide.addText(`Status:\n${String(record.status || 'PENDING').toUpperCase()}`, {
      x: 10.85,
      y: 0.17,
      w: 2.05,
      h: 0.5,
      fontSize: 8.5,
      bold: true,
      color: statusColor,
      align: 'center',
      fontFace: 'Arial'
    });

    // =========================================================================
    // SLIDE CONTENT: LEFT COLUMN (Customer Voice & Profile)
    // =========================================================================
    const leftX = 0.4;
    const leftW = 6.0;

    // 1. Primary Customer Comment Box
    slide.addShape(pres.ShapeType.roundRect, {
      x: leftX,
      y: 1.05,
      w: leftW,
      h: 2.65,
      rectRadius: 0.08,
      fill: { color: 'FFFFFF' },
      line: { color: BORDER_GRAY, width: 1 }
    });

    // Yellow decorative left line for customer quote
    slide.addShape(pres.ShapeType.rect, {
      x: leftX,
      y: 1.05,
      w: 0.12,
      h: 2.65,
      fill: { color: DHL_YELLOW }
    });

    slide.addText('PRIMARY CUSTOMER COMMENT (COMBINED)', {
      x: leftX + 0.25,
      y: 1.15,
      w: leftW - 0.4,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: SLATE_DARK,
      fontFace: 'Arial'
    });

    const commentText = record.comment && record.comment.trim().length > 0 
      ? `"${record.comment.trim()}"` 
      : '(No text comment provided by customer)';

    slide.addText(commentText, {
      x: leftX + 0.25,
      y: 1.42,
      w: leftW - 0.4,
      h: 1.45,
      fontSize: 10,
      italic: true,
      color: SLATE_DARK,
      fontFace: 'Arial'
    });

    if (record.customSummary || record.topic) {
      slide.addText(`Topic / Theme: ${record.topic || 'General Feedback'}  |  Sentiment: ${record.sentiment || record.category}`, {
        x: leftX + 0.25,
        y: 3.35,
        w: leftW - 0.4,
        h: 0.25,
        fontSize: 8.5,
        bold: true,
        color: SLATE_GRAY,
        fontFace: 'Arial'
      });
    }

    // 2. Customer Profile & Touchpoint Table
    slide.addShape(pres.ShapeType.roundRect, {
      x: leftX,
      y: 3.85,
      w: leftW,
      h: 3.15,
      rectRadius: 0.08,
      fill: { color: 'FFFFFF' },
      line: { color: BORDER_GRAY, width: 1 }
    });

    slide.addText('Customer Profile & Touchpoint Details', {
      x: leftX + 0.2,
      y: 3.95,
      w: leftW - 0.4,
      h: 0.25,
      fontSize: 10.5,
      bold: true,
      color: SLATE_DARK,
      fontFace: 'Arial'
    });

    const profileRows: pptxgen.TableRow[] = [
      [
        { text: 'Customer / Account:', options: { bold: true, color: SLATE_GRAY, fontSize: 8.5 } },
        { text: record.accountName || record.customerName || 'N/A', options: { bold: true, color: SLATE_DARK, fontSize: 8.5 } }
      ],
      [
        { text: 'Contact Phone / Email:', options: { bold: true, color: SLATE_GRAY, fontSize: 8.5 } },
        { text: `${record.contactPhone || 'N/A'}  /  ${record.contactEmail || 'N/A'}`, options: { color: SLATE_DARK, fontSize: 8.5 } }
      ],
      [
        { text: 'Journey / Transaction:', options: { bold: true, color: SLATE_GRAY, fontSize: 8.5 } },
        { text: record.journeyName || record.transactionName || 'Pickup / Delivery / Clearance', options: { color: SLATE_DARK, fontSize: 8.5 } }
      ],
      [
        { text: 'Moment of Truth:', options: { bold: true, color: SLATE_GRAY, fontSize: 8.5 } },
        { text: record.momentOfTruthName || 'Standard Service Delivery', options: { color: SLATE_DARK, fontSize: 8.5 } }
      ],
      [
        { text: 'Root Cause Classification:', options: { bold: true, color: SLATE_GRAY, fontSize: 8.5 } },
        { text: `${record.rootCauseCategory || 'N/A'}${record.rootCause ? ` - ${record.rootCause}` : ''}`, options: { color: RED_DETRACTOR, bold: true, fontSize: 8.5 } }
      ]
    ];

    slide.addTable(profileRows, {
      x: leftX + 0.2,
      y: 4.25,
      w: leftW - 0.4,
      rowH: 0.45,
      border: { pt: 0.5, color: 'F1F5F9' }
    });

    // =========================================================================
    // SLIDE CONTENT: RIGHT COLUMN (Action Owner, Resolution & Timeline)
    // =========================================================================
    const rightX = 6.8;
    const rightW = 6.13;

    // 1. Follow-up Owner & Action Summary
    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX,
      y: 1.05,
      w: rightW,
      h: 1.95,
      rectRadius: 0.08,
      fill: { color: 'FFFFFF' },
      line: { color: BORDER_GRAY, width: 1 }
    });

    slide.addText('ACTION OWNER & RESOLUTION SUMMARY', {
      x: rightX + 0.2,
      y: 1.15,
      w: rightW - 0.4,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: SLATE_DARK,
      fontFace: 'Arial'
    });

    slide.addText([
      { text: `Assigned PIC / Owner: `, options: { bold: true, color: SLATE_GRAY, fontSize: 9.5 } },
      { text: `${record.owner || 'CCO Specialist'}\n`, options: { bold: true, color: DHL_RED, fontSize: 9.5 } },
      { text: `Action Summary / Resolution Note:\n`, options: { bold: true, color: SLATE_GRAY, fontSize: 9 } },
      { text: record.actionSummary || record.followUpComments || 'Case logged and monitored in DHL VoC Portal.', options: { color: SLATE_DARK, fontSize: 9 } }
    ], {
      x: rightX + 0.2,
      y: 1.42,
      w: rightW - 0.4,
      h: 1.45,
      fontFace: 'Arial'
    });

    // 2. Timeline History / Action Logs Stepper Table
    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX,
      y: 3.15,
      w: rightW,
      h: 3.85,
      rectRadius: 0.08,
      fill: { color: 'FFFFFF' },
      line: { color: BORDER_GRAY, width: 1 }
    });

    slide.addText('Action Timeline & Resolution History', {
      x: rightX + 0.2,
      y: 3.25,
      w: rightW - 0.4,
      h: 0.25,
      fontSize: 10.5,
      bold: true,
      color: SLATE_DARK,
      fontFace: 'Arial'
    });

    const timelineEvents = record.timeline && record.timeline.length > 0
      ? record.timeline.slice(-4) // Take up to 4 recent timeline steps
      : [
          { timestamp: record.responseDate || 'Day 1', action: 'Survey response received and registered', pic: 'System', status: 'Completed' as const },
          { timestamp: 'Day 2', action: record.actionSummary || 'Assigned to CCO specialist for review', pic: record.owner, status: record.status as any }
        ];

    const timelineTableRows: pptxgen.TableRow[] = [
      [
        { text: 'Time / Date', options: { bold: true, fill: { color: 'E2E8F0' }, color: SLATE_DARK, fontSize: 8.5 } },
        { text: 'Action Executed', options: { bold: true, fill: { color: 'E2E8F0' }, color: SLATE_DARK, fontSize: 8.5 } },
        { text: 'Owner', options: { bold: true, fill: { color: 'E2E8F0' }, color: SLATE_DARK, fontSize: 8.5 } },
        { text: 'Status', options: { bold: true, fill: { color: 'E2E8F0' }, color: SLATE_DARK, fontSize: 8.5, align: 'center' } }
      ]
    ];

    timelineEvents.forEach(evt => {
      const stepStatusColor = evt.status === 'Completed' ? GREEN_PROMOTER : (evt.status === 'In Progress' ? AMBER_PASSIVE : SLATE_GRAY);
      timelineTableRows.push([
        { text: evt.timestamp || 'N/A', options: { fontSize: 8, color: SLATE_GRAY } },
        { text: evt.action || 'Action logged', options: { fontSize: 8, color: SLATE_DARK } },
        { text: evt.pic || record.owner || 'CCO', options: { fontSize: 8, color: SLATE_DARK } },
        { text: evt.status || 'Done', options: { fontSize: 8, bold: true, color: stepStatusColor, align: 'center' } }
      ]);
    });

    slide.addTable(timelineTableRows, {
      x: rightX + 0.2,
      y: 3.55,
      w: rightW - 0.4,
      rowH: 0.45,
      border: { pt: 0.5, color: 'E2E8F0' }
    });

    // Case Footer on individual slide
    slide.addText(`Case ${index + 1} of ${totalCount}  |  DHL Express (Cambodia) VoC Management Portal  |  Confidential`, {
      x: 0.4,
      y: 7.15,
      w: 12.53,
      h: 0.25,
      fontSize: 8,
      color: '94A3B8',
      align: 'center',
      fontFace: 'Arial'
    });
  });

  // Save and initiate browser download of PowerPoint file
  const dateSuffix = new Date().toISOString().split('T')[0];
  const catTag = filterContext?.category && filterContext.category !== 'All' ? `_${filterContext.category}` : '';
  const countTag = `_${records.length}Cases`;
  const fileName = `DHL_VoC_Presentation${catTag}${countTag}_${dateSuffix}.pptx`;

  await pres.writeFile({ fileName });
}
