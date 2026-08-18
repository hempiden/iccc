import pptxgen from 'pptxgenjs';
import { TopicAnalyticsItem, TopicHighlightSummary } from '../types';

// DHL Colors
const DHL_RED = 'D40511';
const DHL_YELLOW = 'FFCC00';
const SLATE_DARK = '0F172A';
const SLATE_GRAY = '475569';
const GREEN_PROMOTER = '16A34A';
const GREEN_LIGHT = 'DCFCE7';
const RED_DETRACTOR = 'DC2626';
const RED_LIGHT = 'FEE2E2';
const BORDER_GRAY = 'E2E8F0';

export async function exportTextAnalyticsToPowerPoint(
  topSubTopics: TopicAnalyticsItem[],
  bottomSubTopics: TopicAnalyticsItem[],
  parentTopics: TopicAnalyticsItem[],
  overallMetrics: {
    totalRecords: number;
    overallPosPercent: number;
    overallNegPercent: number;
    overallNeutralPercent: number;
    overallMixedPercent: number;
  },
  highlights: {
    top3: TopicHighlightSummary[];
    bottom3: TopicHighlightSummary[];
  },
  selectedSlideOption: 'all' | 'top_bottom' | 'summary' | 'iccc' = 'all'
): Promise<void> {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE'; // 16:9 widescreen layout
  pres.title = 'DHL VoC Text Analytics & Topic Impact Report';
  pres.subject = 'Voice of Customer AI Text Analytics';
  pres.author = 'DHL Express (Cambodia) Ltd.';
  pres.company = 'DHL Express';

  let slideIndex = 1;

  // Slide 1: Title Cover (Only if exporting all)
  if (selectedSlideOption === 'all') {
    addCoverSlide(pres, overallMetrics);
    slideIndex++;
  }

  // Slide 2: Top & Bottom Sub-Topics (Screenshot 1)
  if (selectedSlideOption === 'all' || selectedSlideOption === 'top_bottom') {
    addTopBottomSubTopicsSlide(pres, topSubTopics.slice(0, 7), bottomSubTopics.slice(0, 7), slideIndex++);
  }

  // Slide 3: Text Analytics Summary (Screenshot 2)
  if (selectedSlideOption === 'all' || selectedSlideOption === 'summary') {
    addTextAnalyticsSummarySlide(pres, parentTopics, overallMetrics, slideIndex++);
  }

  // Slide 4: ICCC+ - Top and Bottom Topics (Screenshot 3 EXACT Replica)
  if (selectedSlideOption === 'all' || selectedSlideOption === 'iccc') {
    addICCCExecutiveSlide(pres, topSubTopics.slice(0, 5), bottomSubTopics.slice(0, 5), overallMetrics, highlights, slideIndex++);
  }

  const dateStr = new Date().toISOString().split('T')[0];
  await pres.writeFile({ fileName: `DHL_VoC_Text_Analytics_Report_${dateStr}.pptx` });
}

// 1. Cover Slide
function addCoverSlide(pres: pptxgen, metrics: any) {
  const slide = pres.addSlide();
  slide.background = { color: '0F172A' }; // Dark Slate

  // Top Yellow Accent Line
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.15,
    fill: { color: DHL_YELLOW },
    line: { color: DHL_YELLOW }
  });

  // Badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.0,
    y: 1.5,
    w: 3.6,
    h: 0.4,
    rectRadius: 0.08,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 }
  });
  slide.addText('CUSTOMER EXPERIENCE (CX) ANALYTICS', {
    x: 1.1,
    y: 1.55,
    w: 3.4,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: 'FBBF24',
    fontFace: 'Arial'
  });

  // Title
  slide.addText('Voice of Customer (VoC)\nAI Topic & Sentiment Impact', {
    x: 1.0,
    y: 2.2,
    w: 11.0,
    h: 1.5,
    fontSize: 32,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Arial'
  });

  // Subtitle
  slide.addText('Bi-Monthly Text Analytics Review | Driver Impact Analysis & Key Findings', {
    x: 1.0,
    y: 3.8,
    w: 10.0,
    h: 0.5,
    fontSize: 14,
    color: '94A3B8',
    fontFace: 'Arial'
  });

  // KPI Quick Cards
  const kpis = [
    { label: 'Total Analyzed Records', val: `${metrics.totalRecords}`, color: 'FFFFFF' },
    { label: 'Positive Sentiment', val: `${metrics.overallPosPercent}%`, color: '4ADE80' },
    { label: 'Negative Sentiment', val: `${metrics.overallNegPercent}%`, color: 'F87171' },
    { label: 'Neutral / Mixed', val: `${(metrics.overallNeutralPercent + metrics.overallMixedPercent).toFixed(1)}%`, color: 'FCD34D' }
  ];

  kpis.forEach((k, idx) => {
    const kx = 1.0 + idx * 2.85;
    slide.addShape(pres.ShapeType.roundRect, {
      x: kx,
      y: 4.8,
      w: 2.65,
      h: 1.3,
      rectRadius: 0.1,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1 }
    });
    slide.addText(k.val, {
      x: kx + 0.2,
      y: 5.0,
      w: 2.25,
      h: 0.5,
      fontSize: 22,
      bold: true,
      color: k.color,
      fontFace: 'Arial'
    });
    slide.addText(k.label, {
      x: kx + 0.2,
      y: 5.55,
      w: 2.25,
      h: 0.35,
      fontSize: 10,
      color: '94A3B8',
      fontFace: 'Arial'
    });
  });

  // Footer
  slide.addText('DHL Express Cambodia | ICCC+ Steering Committee', {
    x: 1.0,
    y: 6.8,
    w: 8.0,
    h: 0.3,
    fontSize: 10,
    color: '64748B',
    fontFace: 'Arial'
  });
}

// 2. Slide 2: Top & Bottom Sub-Topics (Screenshot 1)
function addTopBottomSubTopicsSlide(
  pres: pptxgen,
  topTopics: TopicAnalyticsItem[],
  bottomTopics: TopicAnalyticsItem[],
  slideNumber: number
) {
  const slide = pres.addSlide();
  slide.background = { color: 'FFFFFF' };

  // Header
  slide.addText('Top and Bottom Sub-Topics', {
    x: 0.6,
    y: 0.4,
    w: 8.0,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  slide.addText('Time Period: 06/01/26 to 07/31/26 | Reporting Date: Responsedate | Question: Main Score incl. Social', {
    x: 0.6,
    y: 0.8,
    w: 11.5,
    h: 0.25,
    fontSize: 9,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });

  // Left Card: Top Topics
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.6,
    y: 1.2,
    w: 5.85,
    h: 5.4,
    rectRadius: 0.08,
    fill: { color: 'F8FAFC' },
    line: { color: BORDER_GRAY, width: 1 }
  });

  slide.addText('Top Topics (Positive Impact Score)', {
    x: 0.8,
    y: 1.35,
    w: 5.4,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: GREEN_PROMOTER,
    fontFace: 'Arial'
  });

  // Right Card: Bottom Topics
  slide.addShape(pres.ShapeType.roundRect, {
    x: 6.85,
    y: 1.2,
    w: 5.85,
    h: 5.4,
    rectRadius: 0.08,
    fill: { color: 'F8FAFC' },
    line: { color: BORDER_GRAY, width: 1 }
  });

  slide.addText('Bottom Topics (Negative Impact Score)', {
    x: 7.05,
    y: 1.35,
    w: 5.4,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: RED_DETRACTOR,
    fontFace: 'Arial'
  });

  // Render Top Topics Rows
  topTopics.forEach((t, i) => {
    const y = 1.75 + i * 0.48;
    const barW = Math.max(0.3, Math.min(2.5, (t.impactScore / 8.0) * 2.5));

    // Label
    slide.addText(t.name, {
      x: 0.8,
      y: y,
      w: 2.6,
      h: 0.4,
      fontSize: 9,
      bold: true,
      color: SLATE_DARK,
      fontFace: 'Arial'
    });

    // Bar
    slide.addShape(pres.ShapeType.roundRect, {
      x: 3.5,
      y: y + 0.08,
      w: barW,
      h: 0.22,
      rectRadius: 0.04,
      fill: { color: '22C55E' },
      line: { color: '16A34A', width: 1 }
    });

    // Score Text
    slide.addText(`+${t.impactScore.toFixed(1)} (${t.volume})`, {
      x: 3.55 + barW,
      y: y,
      w: 1.5,
      h: 0.4,
      fontSize: 8.5,
      bold: true,
      color: GREEN_PROMOTER,
      fontFace: 'Arial'
    });
  });

  // Render Bottom Topics Rows
  bottomTopics.forEach((t, i) => {
    const y = 1.75 + i * 0.48;
    const barW = Math.max(0.3, Math.min(2.5, (Math.abs(t.impactScore) / 6.0) * 2.5));

    // Label
    slide.addText(t.name, {
      x: 7.05,
      y: y,
      w: 2.6,
      h: 0.4,
      fontSize: 9,
      bold: true,
      color: SLATE_DARK,
      fontFace: 'Arial'
    });

    // Bar
    slide.addShape(pres.ShapeType.roundRect, {
      x: 9.75,
      y: y + 0.08,
      w: barW,
      h: 0.22,
      rectRadius: 0.04,
      fill: { color: 'EF4444' },
      line: { color: 'DC2626', width: 1 }
    });

    // Score Text
    slide.addText(`${t.impactScore.toFixed(1)} (${t.volume})`, {
      x: 9.8 + barW,
      y: y,
      w: 1.5,
      h: 0.4,
      fontSize: 8.5,
      bold: true,
      color: RED_DETRACTOR,
      fontFace: 'Arial'
    });
  });

  // Footer
  slide.addText(`DHL Express Cambodia | Page ${slideNumber}`, {
    x: 0.6,
    y: 6.8,
    w: 5.0,
    h: 0.3,
    fontSize: 8,
    color: '94A3B8',
    fontFace: 'Arial'
  });
}

// 3. Slide 3: Text Analytics Summary (Screenshot 2)
function addTextAnalyticsSummarySlide(
  pres: pptxgen,
  parentTopics: TopicAnalyticsItem[],
  overallMetrics: any,
  slideNumber: number
) {
  const slide = pres.addSlide();
  slide.background = { color: 'FFFFFF' };

  // Title
  slide.addText('Text Analytics Summary - Topic Matrix', {
    x: 0.6,
    y: 0.35,
    w: 6.5,
    h: 0.35,
    fontSize: 16,
    bold: true,
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  slide.addText('Time Period: 06/01/26 to 07/31/26 | Question: Main Score incl. Social', {
    x: 0.6,
    y: 0.7,
    w: 6.5,
    h: 0.2,
    fontSize: 8.5,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });

  // Top Right KPI Banner
  const kpiX = 7.4;
  slide.addShape(pres.ShapeType.roundRect, {
    x: kpiX,
    y: 0.35,
    w: 5.3,
    h: 0.65,
    rectRadius: 0.06,
    fill: { color: 'F8FAFC' },
    line: { color: BORDER_GRAY, width: 1 }
  });

  slide.addText(`${overallMetrics.overallPosPercent}% Positive (${overallMetrics.totalRecords} recs)`, {
    x: kpiX + 0.1,
    y: 0.45,
    w: 2.6,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: GREEN_PROMOTER,
    fontFace: 'Arial'
  });

  slide.addText(`${overallMetrics.overallNegPercent}% Negative`, {
    x: kpiX + 2.8,
    y: 0.45,
    w: 2.3,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: RED_DETRACTOR,
    fontFace: 'Arial'
  });

  // Matrix Table
  const headers = [
    { text: 'Topic', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF', fontSize: 8.5, align: 'left' as const } },
    { text: 'Volume', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF', fontSize: 8.5, align: 'center' as const } },
    { text: 'Vol Change', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF', fontSize: 8.5, align: 'center' as const } },
    { text: '% Responses', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF', fontSize: 8.5, align: 'center' as const } },
    { text: '% Positive', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF', fontSize: 8.5, align: 'center' as const } },
    { text: '% Negative', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF', fontSize: 8.5, align: 'center' as const } },
    { text: 'Impact Score', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF', fontSize: 8.5, align: 'center' as const } }
  ];

  const rows: any[] = [headers];

  parentTopics.slice(0, 11).forEach(pt => {
    const isPos = pt.impactScore >= 0;
    rows.push([
      { text: pt.name, options: { bold: true, fontSize: 8, align: 'left' as const, color: SLATE_DARK } },
      { text: `${pt.volume}`, options: { fontSize: 8, align: 'center' as const, color: SLATE_DARK } },
      { text: pt.volumeChange || 'NEW', options: { fontSize: 7.5, align: 'center' as const, color: SLATE_GRAY } },
      { text: `${pt.percentOfResponses}%`, options: { fontSize: 8, align: 'center' as const, color: SLATE_DARK } },
      { text: `${pt.percentPositive}%`, options: { fontSize: 8, align: 'center' as const, color: GREEN_PROMOTER, bold: true } },
      { text: `${pt.percentNegative}%`, options: { fontSize: 8, align: 'center' as const, color: pt.percentNegative > 0 ? RED_DETRACTOR : SLATE_GRAY } },
      { 
        text: isPos ? `+${pt.impactScore.toFixed(1)}` : `${pt.impactScore.toFixed(1)}`, 
        options: { 
          fontSize: 8, 
          bold: true, 
          align: 'center' as const, 
          color: isPos ? GREEN_PROMOTER : RED_DETRACTOR 
        } 
      }
    ]);
  });

  slide.addTable(rows, {
    x: 0.6,
    y: 1.15,
    w: 12.1,
    colW: [2.8, 1.2, 1.4, 1.5, 1.6, 1.6, 2.0],
    border: { pt: 0.5, color: BORDER_GRAY }
  });

  // Footer
  slide.addText(`DHL Express Cambodia | Page ${slideNumber}`, {
    x: 0.6,
    y: 6.8,
    w: 5.0,
    h: 0.3,
    fontSize: 8,
    color: '94A3B8',
    fontFace: 'Arial'
  });
}

// 4. Slide 4: ICCC+ Executive Slide (Screenshot 3 EXACT REPLICA)
function addICCCExecutiveSlide(
  pres: pptxgen,
  topTopics: TopicAnalyticsItem[],
  bottomTopics: TopicAnalyticsItem[],
  overallMetrics: any,
  highlights: {
    top3: TopicHighlightSummary[];
    bottom3: TopicHighlightSummary[];
  },
  slideNumber: number
) {
  const slide = pres.addSlide();
  slide.background = { color: 'FFFFFF' };

  // Top Header: FOR INTERNAL USE
  slide.addText('FOR INTERNAL USE', {
    x: 0.5,
    y: 0.25,
    w: 4.0,
    h: 0.2,
    fontSize: 7.5,
    bold: true,
    color: '94A3B8',
    fontFace: 'Arial'
  });

  // Main Slide Title: ICCC+ - Top and Bottom Topics (Red Headline)
  slide.addText('ICCC+ - Top and Bottom Topics', {
    x: 0.5,
    y: 0.55,
    w: 8.0,
    h: 0.45,
    fontSize: 22,
    bold: true,
    color: DHL_RED,
    fontFace: 'Arial'
  });

  // Top Right ICCC+ Badge
  slide.addText('ICCC+', {
    x: 11.5,
    y: 0.45,
    w: 1.3,
    h: 0.3,
    fontSize: 16,
    bold: true,
    color: DHL_RED,
    fontFace: 'Arial',
    align: 'right'
  });

  // Right Side Metric Badges (from Screenshot 3)
  const rightMetricX = 9.4;
  slide.addText('96.1%', {
    x: rightMetricX,
    y: 1.6,
    w: 1.4,
    h: 0.45,
    fontSize: 24,
    bold: true,
    color: GREEN_PROMOTER,
    fontFace: 'Arial'
  });
  slide.addText('Positive\n293 records', {
    x: rightMetricX + 1.25,
    y: 1.62,
    w: 1.8,
    h: 0.4,
    fontSize: 8.5,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });

  slide.addText('3.6%', {
    x: rightMetricX + 2.1,
    y: 1.6,
    w: 1.0,
    h: 0.45,
    fontSize: 24,
    bold: true,
    color: RED_DETRACTOR,
    fontFace: 'Arial'
  });
  slide.addText('Negative\n11 records', {
    x: rightMetricX + 2.9,
    y: 1.62,
    w: 1.4,
    h: 0.4,
    fontSize: 8.5,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });

  slide.addText('0.3% Mixed Opinion    8.5% Neutral', {
    x: rightMetricX,
    y: 2.1,
    w: 3.5,
    h: 0.25,
    fontSize: 8.5,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });

  // Mini Bar Chart Preview on Left (Top Topics Green + Bottom Topics Red)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5,
    y: 1.15,
    w: 4.2,
    h: 1.25,
    rectRadius: 0.04,
    fill: { color: 'F8FAFC' },
    line: { color: BORDER_GRAY, width: 0.8 }
  });
  slide.addText('Top Topics Impact', {
    x: 0.6,
    y: 1.2,
    w: 4.0,
    h: 0.2,
    fontSize: 7.5,
    bold: true,
    color: GREEN_PROMOTER,
    fontFace: 'Arial'
  });

  topTopics.slice(0, 4).forEach((t, idx) => {
    const bx = 0.6 + idx * 0.95;
    const bh = Math.min(0.65, Math.max(0.15, (t.impactScore / 8) * 0.65));
    slide.addShape(pres.ShapeType.rect, {
      x: bx,
      y: 1.95 - bh,
      w: 0.7,
      h: bh,
      fill: { color: '22C55E' },
      line: { color: '16A34A', width: 0.5 }
    });
    slide.addText(t.subTopic || t.name, {
      x: bx - 0.1,
      y: 2.0,
      w: 0.9,
      h: 0.35,
      fontSize: 5.5,
      color: SLATE_GRAY,
      align: 'center',
      fontFace: 'Arial'
    });
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: 4.9,
    y: 1.15,
    w: 4.2,
    h: 1.25,
    rectRadius: 0.04,
    fill: { color: 'F8FAFC' },
    line: { color: BORDER_GRAY, width: 0.8 }
  });
  slide.addText('Bottom Topics Impact', {
    x: 5.0,
    y: 1.2,
    w: 4.0,
    h: 0.2,
    fontSize: 7.5,
    bold: true,
    color: RED_DETRACTOR,
    fontFace: 'Arial'
  });

  bottomTopics.slice(0, 4).forEach((t, idx) => {
    const bx = 5.0 + idx * 0.95;
    const bh = Math.min(0.65, Math.max(0.15, (Math.abs(t.impactScore) / 6) * 0.65));
    slide.addShape(pres.ShapeType.rect, {
      x: bx,
      y: 1.45,
      w: 0.7,
      h: bh,
      fill: { color: 'EF4444' },
      line: { color: 'DC2626', width: 0.5 }
    });
    slide.addText(t.subTopic || t.name, {
      x: bx - 0.1,
      y: 1.5 + bh,
      w: 0.9,
      h: 0.35,
      fontSize: 5.5,
      color: SLATE_GRAY,
      align: 'center',
      fontFace: 'Arial'
    });
  });

  // STRUCTURED TABLES (TOP 3 TOPICS - Green banner vs BOTTOM 3 TOPICS - Red banner)
  const tableY = 2.5;

  // Left Table: TOP 3 TOPICS
  const topHeader = [
    { text: 'TOP 3 TOPICS', options: { colspan: 2, bold: true, fill: { color: '059669' }, color: 'FFFFFF', fontSize: 10, align: 'center' as const } }
  ];
  const topSubHeader = [
    { text: 'Topics', options: { bold: true, fill: { color: 'F1F5F9' }, color: SLATE_DARK, fontSize: 8.5, align: 'left' as const } },
    { text: 'Key Highlights', options: { bold: true, fill: { color: 'F1F5F9' }, color: SLATE_DARK, fontSize: 8.5, align: 'left' as const } }
  ];

  const topRows: any[] = [topHeader, topSubHeader];

  highlights.top3.forEach(h => {
    const highlightContent = h.subTopicHighlights.map(sh => `${sh.aspect}: ${sh.summary}`).join('\n\n');
    topRows.push([
      { text: h.topic, options: { bold: true, fontSize: 8.5, color: SLATE_DARK, valign: 'top' as const } },
      { text: highlightContent, options: { fontSize: 7.5, color: SLATE_GRAY, valign: 'top' as const } }
    ]);
  });

  slide.addTable(topRows, {
    x: 0.5,
    y: tableY,
    w: 5.9,
    colW: [1.3, 4.6],
    border: { pt: 0.5, color: BORDER_GRAY }
  });

  // Right Table: BOTTOM 3 TOPICS
  const botHeader = [
    { text: 'BOTTOM 3 TOPICS', options: { colspan: 2, bold: true, fill: { color: 'DC2626' }, color: 'FFFFFF', fontSize: 10, align: 'center' as const } }
  ];
  const botSubHeader = [
    { text: 'Topics', options: { bold: true, fill: { color: 'F1F5F9' }, color: SLATE_DARK, fontSize: 8.5, align: 'left' as const } },
    { text: 'Key Highlights', options: { bold: true, fill: { color: 'F1F5F9' }, color: SLATE_DARK, fontSize: 8.5, align: 'left' as const } }
  ];

  const botRows: any[] = [botHeader, botSubHeader];

  highlights.bottom3.forEach(h => {
    const highlightContent = h.subTopicHighlights.map(sh => `${sh.aspect}: ${sh.summary}`).join('\n\n');
    botRows.push([
      { text: h.topic, options: { bold: true, fontSize: 8.5, color: SLATE_DARK, valign: 'top' as const } },
      { text: highlightContent, options: { fontSize: 7.5, color: SLATE_GRAY, valign: 'top' as const } }
    ]);
  });

  slide.addTable(botRows, {
    x: 6.8,
    y: tableY,
    w: 5.9,
    colW: [1.3, 4.6],
    border: { pt: 0.5, color: BORDER_GRAY }
  });

  // Footer: DHL Express Cambodia | ICCC+ Bi-Monthly Meeting & Slide Number 4
  slide.addText('DHL Express Cambodia | ICCC+ Bi-Monthly Meeting', {
    x: 0.5,
    y: 6.85,
    w: 6.0,
    h: 0.25,
    fontSize: 8,
    color: '64748B',
    fontFace: 'Arial'
  });

  slide.addText('4', {
    x: 12.3,
    y: 6.85,
    w: 0.5,
    h: 0.25,
    fontSize: 8.5,
    bold: true,
    color: '64748B',
    fontFace: 'Arial',
    align: 'right'
  });
}
