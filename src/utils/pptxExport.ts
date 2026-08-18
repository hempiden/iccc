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
  const topicTag = (record.topic || 'CUSTOMS_CLEARANCE').toUpperCase().replace(/\s+/g, '_');
  const catTag = record.category.toUpperCase();
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
  const compName = record.accountName || record.customerName || 'ACTEUS CAMBODIA CO., LTD';
  slide.addText(`(${compName.toUpperCase()})`, {
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

  slide.addText(record.status.toUpperCase(), {
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


/**
 * Adds the Executive Summary & Scorecard Slide to a PowerPoint presentation
 */
export function addExecutiveSummarySlide(
  pres: pptxgen,
  records: VoCRecord[],
  filterContext?: ExportFilterContext,
  currentUser?: ActionOwner | null,
  hasSubsequentSlides: boolean = true
): void {
  // Calculate Aggregated Metrics for Summary Slide
  const totalCount = records.length;
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  let sumScore = 0;
  let completedCases = 0;
  let inProgressCases = 0;
  let newCases = 0;

  const facilityCounts: Record<string, { total: number; promoters: number; passives: number; detractors: number }> = {};

  records.forEach(r => {
    sumScore += r.likelihood;
    if (r.category === 'Promoter') promoters++;
    else if (r.category === 'Passive') passives++;
    else detractors++;

    if (r.status === 'Completed') completedCases++;
    else if (r.status === 'In Progress') inProgressCases++;
    else newCases++;

    const fac = r.interaction || 'PNHGTW';
    if (!facilityCounts[fac]) {
      facilityCounts[fac] = { total: 0, promoters: 0, passives: 0, detractors: 0 };
    }
    facilityCounts[fac].total++;
    if (r.category === 'Promoter') facilityCounts[fac].promoters++;
    else if (r.category === 'Passive') facilityCounts[fac].passives++;
    else facilityCounts[fac].detractors++;
  });

  const promoterPct = Math.round((promoters / totalCount) * 100) || 0;
  const passivePct = Math.round((passives / totalCount) * 100) || 0;
  const detractorPct = Math.round((detractors / totalCount) * 100) || 0;
  const npsScore = promoterPct - detractorPct;
  const avgScore = totalCount > 0 ? (sumScore / totalCount).toFixed(1) : '0.0';
  const completionRate = Math.round((completedCases / totalCount) * 100) || 0;

  // =========================================================================
  // SLIDE: EXECUTIVE SUMMARY & PERFORMANCE SCORECARD
  // =========================================================================
  const summarySlide = pres.addSlide();
  summarySlide.background = { color: 'F1F5F9' };

  // Top Yellow Header Bar
  summarySlide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.9,
    fill: { color: DHL_YELLOW },
    line: { color: DHL_YELLOW }
  });

  // Top Bar Brand Accent
  summarySlide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.25,
    h: 0.9,
    fill: { color: DHL_RED }
  });

  summarySlide.addText('DHL EXPRESS | VOICE OF CUSTOMER (VoC)', {
    x: 0.5,
    y: 0.12,
    w: 7.0,
    h: 0.35,
    fontSize: 16,
    bold: true,
    color: DHL_RED,
    fontFace: 'Arial'
  });

  summarySlide.addText('Executive Summary & Case Resolution Portfolio', {
    x: 0.5,
    y: 0.45,
    w: 7.0,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  // Filter Subtitle / Metadata on Right
  const filterDesc = [
    filterContext?.category && filterContext.category !== 'All' ? `Category: ${filterContext.category}` : 'All Categories',
    filterContext?.status && filterContext.status !== 'All' ? `Status: ${filterContext.status}` : 'All Statuses',
    filterContext?.channel && filterContext.channel !== 'All' ? `Channel: ${filterContext.channel}` : 'All Channels',
    filterContext?.dateRange ? `Window: ${filterContext.dateRange}` : ''
  ].filter(Boolean).join('  |  ');

  summarySlide.addText([
    { text: `Scope: ${totalCount} Cases Selected\n`, options: { bold: true, fontSize: 10, color: SLATE_DARK } },
    { text: `${filterDesc}\nExported: ${new Date().toLocaleDateString('en-GB')} by ${currentUser?.fullName || 'Hempiden'}`, options: { fontSize: 8.5, color: SLATE_GRAY } }
  ], {
    x: 7.8,
    y: 0.12,
    w: 5.0,
    h: 0.7,
    align: 'right',
    fontFace: 'Arial'
  });

  // 4 Top Scorecard KPI Cards
  const kpiY = 1.15;
  const kpiW = 2.85;
  const kpiH = 1.25;
  const kpiGap = 0.28;

  // 1. Net Promoter Score Card
  summarySlide.addShape(pres.ShapeType.roundRect, {
    x: 0.5,
    y: kpiY,
    w: kpiW,
    h: kpiH,
    rectRadius: 0.1,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER_GRAY, width: 1 }
  });
  summarySlide.addText('NET PROMOTER SCORE', {
    x: 0.65,
    y: kpiY + 0.12,
    w: kpiW - 0.3,
    h: 0.25,
    fontSize: 9.5,
    bold: true,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });
  summarySlide.addText(`${npsScore > 0 ? '+' : ''}${npsScore}%`, {
    x: 0.65,
    y: kpiY + 0.35,
    w: kpiW - 0.3,
    h: 0.5,
    fontSize: 26,
    bold: true,
    color: npsScore >= 50 ? GREEN_PROMOTER : (npsScore >= 0 ? AMBER_PASSIVE : RED_DETRACTOR),
    fontFace: 'Arial'
  });
  summarySlide.addText(`Target: >= 70% | Scale: -100 to +100`, {
    x: 0.65,
    y: kpiY + 0.88,
    w: kpiW - 0.3,
    h: 0.25,
    fontSize: 8,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });

  // 2. Average Likelihood Score Card
  summarySlide.addShape(pres.ShapeType.roundRect, {
    x: 0.5 + (kpiW + kpiGap),
    y: kpiY,
    w: kpiW,
    h: kpiH,
    rectRadius: 0.1,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER_GRAY, width: 1 }
  });
  summarySlide.addText('AVG LIKELIHOOD SCORE', {
    x: 0.5 + (kpiW + kpiGap) + 0.15,
    y: kpiY + 0.12,
    w: kpiW - 0.3,
    h: 0.25,
    fontSize: 9.5,
    bold: true,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });
  summarySlide.addText(`${avgScore} / 10`, {
    x: 0.5 + (kpiW + kpiGap) + 0.15,
    y: kpiY + 0.35,
    w: kpiW - 0.3,
    h: 0.5,
    fontSize: 26,
    bold: true,
    color: SLATE_DARK,
    fontFace: 'Arial'
  });
  summarySlide.addText(`Based on ${totalCount} recorded responses`, {
    x: 0.5 + (kpiW + kpiGap) + 0.15,
    y: kpiY + 0.88,
    w: kpiW - 0.3,
    h: 0.25,
    fontSize: 8,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });

  // 3. Sentiment & NPS Category Distribution Card
  summarySlide.addShape(pres.ShapeType.roundRect, {
    x: 0.5 + (kpiW + kpiGap) * 2,
    y: kpiY,
    w: kpiW,
    h: kpiH,
    rectRadius: 0.1,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER_GRAY, width: 1 }
  });
  summarySlide.addText('SENTIMENT BREAKDOWN', {
    x: 0.5 + (kpiW + kpiGap) * 2 + 0.15,
    y: kpiY + 0.12,
    w: kpiW - 0.3,
    h: 0.25,
    fontSize: 9.5,
    bold: true,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });
  summarySlide.addText([
    { text: `Promoters (9-10):  ${promoterPct}% (${promoters})\n`, options: { color: GREEN_PROMOTER, bold: true, fontSize: 9.5 } },
    { text: `Passives (7-8):        ${passivePct}% (${passives})\n`, options: { color: AMBER_PASSIVE, bold: true, fontSize: 9.5 } },
    { text: `Detractors (0-6):    ${detractorPct}% (${detractors})`, options: { color: RED_DETRACTOR, bold: true, fontSize: 9.5 } }
  ], {
    x: 0.5 + (kpiW + kpiGap) * 2 + 0.15,
    y: kpiY + 0.42,
    w: kpiW - 0.3,
    h: 0.75,
    fontFace: 'Arial'
  });

  // 4. Case Action & Resolution Status Card
  summarySlide.addShape(pres.ShapeType.roundRect, {
    x: 0.5 + (kpiW + kpiGap) * 3,
    y: kpiY,
    w: kpiW,
    h: kpiH,
    rectRadius: 0.1,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER_GRAY, width: 1 }
  });
  summarySlide.addText('ACTION & RESOLUTION HEALTH', {
    x: 0.5 + (kpiW + kpiGap) * 3 + 0.15,
    y: kpiY + 0.12,
    w: kpiW - 0.3,
    h: 0.25,
    fontSize: 9.5,
    bold: true,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });
  summarySlide.addText(`${completionRate}% Resolved`, {
    x: 0.5 + (kpiW + kpiGap) * 3 + 0.15,
    y: kpiY + 0.35,
    w: kpiW - 0.3,
    h: 0.45,
    fontSize: 22,
    bold: true,
    color: completionRate >= 80 ? GREEN_PROMOTER : (completionRate >= 50 ? AMBER_PASSIVE : RED_DETRACTOR),
    fontFace: 'Arial'
  });
  summarySlide.addText(`Completed: ${completedCases}  |  In Progress: ${inProgressCases}  |  New: ${newCases}`, {
    x: 0.5 + (kpiW + kpiGap) * 3 + 0.15,
    y: kpiY + 0.88,
    w: kpiW - 0.3,
    h: 0.25,
    fontSize: 8,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });

  // Lower Section: 2 Structural Analysis Panels
  const lowerY = 2.65;
  const panelW = 5.95;
  const panelH = 4.3;

  // Left Panel: Facility & Survey Channel Distribution Table
  summarySlide.addShape(pres.ShapeType.roundRect, {
    x: 0.5,
    y: lowerY,
    w: panelW,
    h: panelH,
    rectRadius: 0.1,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER_GRAY, width: 1 }
  });
  summarySlide.addText('Touchpoint & Facility Breakdown', {
    x: 0.7,
    y: lowerY + 0.2,
    w: panelW - 0.4,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  const facilityTableRows: pptxgen.TableRow[] = [
    [
      { text: 'Facility / Channel', options: { bold: true, fill: { color: 'E2E8F0' }, color: SLATE_DARK, fontSize: 9.5 } },
      { text: 'Total', options: { bold: true, fill: { color: 'E2E8F0' }, color: SLATE_DARK, fontSize: 9.5, align: 'center' } },
      { text: 'Promoters', options: { bold: true, fill: { color: 'E2E8F0' }, color: GREEN_PROMOTER, fontSize: 9.5, align: 'center' } },
      { text: 'Passives', options: { bold: true, fill: { color: 'E2E8F0' }, color: AMBER_PASSIVE, fontSize: 9.5, align: 'center' } },
      { text: 'Detractors', options: { bold: true, fill: { color: 'E2E8F0' }, color: RED_DETRACTOR, fontSize: 9.5, align: 'center' } }
    ]
  ];

  Object.entries(facilityCounts).forEach(([fac, stats]) => {
    facilityTableRows.push([
      { text: fac, options: { bold: true, color: SLATE_DARK, fontSize: 9 } },
      { text: `${stats.total}`, options: { align: 'center', fontSize: 9, color: SLATE_DARK } },
      { text: `${stats.promoters}`, options: { align: 'center', fontSize: 9, color: GREEN_PROMOTER } },
      { text: `${stats.passives}`, options: { align: 'center', fontSize: 9, color: AMBER_PASSIVE } },
      { text: `${stats.detractors}`, options: { align: 'center', fontSize: 9, color: RED_DETRACTOR } }
    ]);
  });

  summarySlide.addTable(facilityTableRows, {
    x: 0.7,
    y: lowerY + 0.6,
    w: panelW - 0.4,
    rowH: 0.35,
    border: { pt: 0.5, color: 'E2E8F0' }
  });

  // Right Panel: Key Takeaways & Action Governance
  summarySlide.addShape(pres.ShapeType.roundRect, {
    x: 0.5 + panelW + 0.43,
    y: lowerY,
    w: panelW,
    h: panelH,
    rectRadius: 0.1,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER_GRAY, width: 1 }
  });
  summarySlide.addText('Executive Focus & Case Governance', {
    x: 0.5 + panelW + 0.63,
    y: lowerY + 0.2,
    w: panelW - 0.4,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  const governanceThirdBullet = hasSubsequentSlides
    ? `The following ${totalCount} slides contain itemized customer transcripts, timeline audit steps, assigned PICs, and resolution notes for each individual record.`
    : `The Voice of Customer intelligence database records itemized customer transcripts, timeline audit steps, and resolution notes across all ${totalCount} cases.`;

  summarySlide.addText([
    { text: '1. Fast-Track Detractor Resolution\n', options: { bold: true, color: RED_DETRACTOR, fontSize: 10 } },
    { text: `There are currently ${detractors} detractor case(s) requiring strict 24-hour first response and root cause logging.\n\n`, options: { color: SLATE_GRAY, fontSize: 9 } },
    { text: '2. Closed-Loop Customer Contact (CCC)\n', options: { bold: true, color: SLATE_DARK, fontSize: 10 } },
    { text: `${completionRate}% of current cases have reached "Completed" closed status with verified customer follow-up.\n\n`, options: { color: SLATE_GRAY, fontSize: 9 } },
    { text: hasSubsequentSlides ? '3. Follow-up Details on Subsequent Slides\n' : '3. Case Portfolio Governance\n', options: { bold: true, color: SLATE_DARK, fontSize: 10 } },
    { text: governanceThirdBullet, options: { color: SLATE_GRAY, fontSize: 9 } }
  ], {
    x: 0.5 + panelW + 0.63,
    y: lowerY + 0.65,
    w: panelW - 0.4,
    h: 3.4,
    fontFace: 'Arial'
  });

  // Footer on summary slide
  summarySlide.addText('DHL Express (Cambodia) Ltd. | Voice of Customer Management System | Confidential', {
    x: 0.5,
    y: 7.15,
    w: 12.33,
    h: 0.25,
    fontSize: 8,
    color: '94A3B8',
    align: 'center',
    fontFace: 'Arial'
  });
}

/**
 * Exports a standalone 1-slide PowerPoint presentation (.pptx)
 * of the Executive Summary & Scorecard view in 16:9 widescreen layout.
 */
export async function exportExecutiveSummarySlideToPowerPoint(
  records: VoCRecord[],
  filterContext?: ExportFilterContext,
  currentUser?: ActionOwner | null
): Promise<void> {
  if (!records || records.length === 0) {
    alert('No records available to export.');
    return;
  }

  // Initialize PptxGenJS in 16:9 widescreen layout (13.33 x 7.5 inches)
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'DHL Voice of Customer - Executive Summary Scorecard';
  pres.subject = 'VoC Executive Scorecard & KPI Portfolio';
  pres.author = currentUser?.fullName || 'Hempiden';
  pres.company = 'DHL Express';

  // Add the 1-page Executive Summary Slide
  addExecutiveSummarySlide(pres, records, filterContext, currentUser, false);

  // Generate file name and download
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
  currentUser?: ActionOwner | null
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

  // Add Slide 1: Executive Summary Scorecard
  addExecutiveSummarySlide(pres, records, filterContext, currentUser, true);

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
    slide.addText(`Score: ${record.likelihood}/10\n${record.category.toUpperCase()}`, {
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
    slide.addText(`Status:\n${record.status.toUpperCase()}`, {
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
