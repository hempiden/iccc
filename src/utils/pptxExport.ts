import pptxgen from 'pptxgenjs';
import { VoCRecord, ActionOwner } from '../types';
import { ExportFilterContext } from './excelDatabase';
import { getCleanSurveyId } from './parser';

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

  // Palette Constants (DHL Brand System)
  const DHL_YELLOW = 'FFCC00';
  const DHL_RED = 'D40511';
  const SLATE_DARK = '0F172A';
  const SLATE_GRAY = '334155';
  const SLATE_LIGHT = 'F8FAFC';
  const BORDER_GRAY = 'CBD5E1';
  const GREEN_PROMOTER = '059669';
  const AMBER_PASSIVE = 'D97706';
  const RED_DETRACTOR = 'DC2626';

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
  const avgScore = (sumScore / totalCount).toFixed(1);
  const completionRate = Math.round((completedCases / totalCount) * 100) || 0;

  // =========================================================================
  // SLIDE 1: EXECUTIVE SUMMARY & PERFORMANCE SCORECARD
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
    { text: `${filterDesc}\nExported: ${new Date().toLocaleDateString('en-GB')} by ${currentUser?.fullName || 'Colleague'}`, options: { fontSize: 8.5, color: SLATE_GRAY } }
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

  summarySlide.addText([
    { text: '1. Fast-Track Detractor Resolution\n', options: { bold: true, color: RED_DETRACTOR, fontSize: 10 } },
    { text: `There are currently ${detractors} detractor case(s) requiring strict 24-hour first response and root cause logging.\n\n`, options: { color: SLATE_GRAY, fontSize: 9 } },
    { text: '2. Closed-Loop Customer Contact (CCC)\n', options: { bold: true, color: SLATE_DARK, fontSize: 10 } },
    { text: `${completionRate}% of current cases have reached "Completed" closed status with verified customer follow-up.\n\n`, options: { color: SLATE_GRAY, fontSize: 9 } },
    { text: '3. Follow-up Details on Subsequent Slides\n', options: { bold: true, color: SLATE_DARK, fontSize: 10 } },
    { text: `The following ${totalCount} slides contain itemized customer transcripts, timeline audit steps, assigned PICs, and resolution notes for each individual record.`, options: { color: SLATE_GRAY, fontSize: 9 } }
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
