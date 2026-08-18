import pptxgen from 'pptxgenjs';
import { TopicAnalyticsItem, TopicHighlightSummary } from '../types';

// DHL Colors & Executive Palette
const DHL_RED = 'D40511';
const DHL_YELLOW = 'FFCC00';
const SLATE_DARK = '0F172A';
const SLATE_GRAY = '475569';
const SLATE_LIGHT = '64748B';
const SLATE_MUTED = '94A3B8';
const GREEN_PROMOTER = '16A34A';
const GREEN_BG = 'DCFCE7';
const RED_DETRACTOR = 'DC2626';
const RED_BG = 'FEE2E2';
const BORDER_GRAY = 'CBD5E1';
const BORDER_LIGHT = 'E2E8F0';
const BG_OFFWHITE = 'F8FAFC';

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
  pres.layout = 'LAYOUT_WIDE'; // 16:9 widescreen layout (13.33 x 7.5 inches)
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

  // Slide 4: ICCC+ - Top and Bottom Topics (Screenshot 3 EXACT Executive Slide)
  if (selectedSlideOption === 'all' || selectedSlideOption === 'iccc') {
    addICCCExecutiveSlide(pres, topSubTopics.slice(0, 5), bottomSubTopics.slice(0, 5), overallMetrics, highlights, slideIndex++);
  }

  const dateStr = new Date().toISOString().split('T')[0];
  await pres.writeFile({ fileName: `DHL_VoC_Text_Analytics_Report_${dateStr}.pptx` });
}

// =========================================================================
// 1. COVER SLIDE
// =========================================================================
function addCoverSlide(pres: pptxgen, metrics: any) {
  const slide = pres.addSlide();
  slide.background = { color: '0F172A' }; // Dark Slate

  // Top Yellow Accent Line
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.16,
    fill: { color: DHL_YELLOW },
    line: { color: DHL_YELLOW }
  });

  // Category Pill
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8,
    y: 1.2,
    w: 3.8,
    h: 0.42,
    rectRadius: 0.08,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1.2 }
  });
  slide.addText('CUSTOMER EXPERIENCE (CX) ANALYTICS', {
    x: 0.8,
    y: 1.25,
    w: 3.8,
    h: 0.32,
    fontSize: 9.5,
    bold: true,
    color: 'FBBF24',
    align: 'center',
    fontFace: 'Arial'
  });

  // Main Title
  slide.addText('Voice of Customer (VoC)\nAI Topic & Sentiment Impact', {
    x: 0.8,
    y: 1.85,
    w: 11.5,
    h: 1.7,
    fontSize: 34,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Arial'
  });

  // Subtitle
  slide.addText('Bi-Monthly Text Analytics Review | Driver Impact Analysis & Key Action Findings', {
    x: 0.8,
    y: 3.65,
    w: 11.5,
    h: 0.45,
    fontSize: 13,
    color: '94A3B8',
    fontFace: 'Arial'
  });

  // KPI Quick Cards (4 Column Grid)
  const kpis = [
    { label: 'Total Analyzed Records', val: `${metrics.totalRecords}`, color: 'FFFFFF' },
    { label: 'Positive Sentiment Rate', val: `${metrics.overallPosPercent}%`, color: '4ADE80' },
    { label: 'Negative Sentiment Rate', val: `${metrics.overallNegPercent}%`, color: 'F87171' },
    { label: 'Neutral / Mixed Rate', val: `${(metrics.overallNeutralPercent + metrics.overallMixedPercent).toFixed(1)}%`, color: 'FCD34D' }
  ];

  kpis.forEach((k, idx) => {
    const kx = 0.8 + idx * 2.95;
    slide.addShape(pres.ShapeType.roundRect, {
      x: kx,
      y: 4.45,
      w: 2.75,
      h: 1.65,
      rectRadius: 0.1,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1.2 }
    });
    slide.addText(k.val, {
      x: kx + 0.2,
      y: 4.7,
      w: 2.35,
      h: 0.65,
      fontSize: 26,
      bold: true,
      color: k.color,
      fontFace: 'Arial'
    });
    slide.addText(k.label, {
      x: kx + 0.2,
      y: 5.45,
      w: 2.35,
      h: 0.45,
      fontSize: 10.5,
      bold: true,
      color: '94A3B8',
      fontFace: 'Arial'
    });
  });

  // Footer
  slide.addText('DHL Express Cambodia | ICCC+ Steering Committee', {
    x: 0.8,
    y: 6.85,
    w: 8.0,
    h: 0.3,
    fontSize: 9.5,
    color: '64748B',
    fontFace: 'Arial'
  });
}

// =========================================================================
// 2. SLIDE 2: TOP & BOTTOM SUB-TOPICS (SCREENSHOT 1 REPLICA)
// =========================================================================
function addTopBottomSubTopicsSlide(
  pres: pptxgen,
  topTopics: TopicAnalyticsItem[],
  bottomTopics: TopicAnalyticsItem[],
  slideNumber: number
) {
  const slide = pres.addSlide();
  slide.background = { color: 'FFFFFF' };

  // Top Yellow Accent Line
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.1,
    fill: { color: DHL_YELLOW },
    line: { color: DHL_YELLOW }
  });

  // Header
  slide.addText('Top and Bottom Sub-Topics', {
    x: 0.6,
    y: 0.35,
    w: 8.0,
    h: 0.4,
    fontSize: 20,
    bold: true,
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  slide.addText('Time Period: 06/01/26 to 07/31/26 | Reporting Date: Responsedate | Question: Main Score incl. Social', {
    x: 0.6,
    y: 0.78,
    w: 12.1,
    h: 0.25,
    fontSize: 9,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });

  // Container Card Left: Top Topics
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.6,
    y: 1.15,
    w: 5.9,
    h: 5.5,
    rectRadius: 0.08,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER_LIGHT, width: 1.2 }
  });

  // Container Card Right: Bottom Topics
  slide.addShape(pres.ShapeType.roundRect, {
    x: 6.83,
    y: 1.15,
    w: 5.9,
    h: 5.5,
    rectRadius: 0.08,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER_LIGHT, width: 1.2 }
  });

  // Left Column Table: TOP TOPICS
  const topTableHeaders = [
    { text: 'Top Topics', options: { bold: true, fontSize: 10, color: SLATE_DARK, fill: { color: 'F1F5F9' }, align: 'left' as const } },
    { text: 'Summary', options: { bold: true, fontSize: 9.5, color: '4F46E5', fill: { color: 'F1F5F9' }, align: 'center' as const } },
    { text: 'Impact Score', options: { bold: true, fontSize: 10, color: SLATE_DARK, fill: { color: 'F1F5F9' }, align: 'right' as const } }
  ];

  const topRows: any[] = [topTableHeaders];

  // Helper for Green Color based on Impact
  const getGreenPillColor = (score: number) => {
    if (score >= 6.0) return '48BB78';
    if (score >= 3.0) return '68D391';
    if (score >= 1.5) return '9AE6B4';
    if (score >= 1.0) return 'C6F6D5';
    return 'E6FFFA';
  };

  topTopics.forEach((t) => {
    topRows.push([
      { 
        text: t.name, 
        options: { 
          bold: true, 
          fontSize: 9.5, 
          color: '4338CA', 
          valign: 'middle' as const,
          margin: [6, 4, 6, 6]
        } 
      },
      { 
        text: 'View', 
        options: { 
          bold: true, 
          fontSize: 9, 
          color: '4F46E5', 
          align: 'center' as const, 
          valign: 'middle' as const 
        } 
      },
      { 
        text: `+${t.impactScore.toFixed(1)}`, 
        options: { 
          bold: true, 
          fontSize: 10.5, 
          color: SLATE_DARK, 
          align: 'right' as const, 
          valign: 'middle' as const,
          fill: { color: getGreenPillColor(t.impactScore) },
          margin: [4, 8, 4, 4]
        } 
      }
    ]);
  });

  slide.addTable(topRows, {
    x: 0.75,
    y: 1.3,
    w: 5.6,
    colW: [3.3, 0.9, 1.4],
    border: { pt: 0.5, color: BORDER_LIGHT },
    rowH: [0.35, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55]
  });

  // Right Column Table: BOTTOM TOPICS
  const botTableHeaders = [
    { text: 'Bottom Topics', options: { bold: true, fontSize: 10, color: SLATE_DARK, fill: { color: 'F1F5F9' }, align: 'left' as const } },
    { text: 'Summary', options: { bold: true, fontSize: 9.5, color: '4F46E5', fill: { color: 'F1F5F9' }, align: 'center' as const } },
    { text: 'Impact Score', options: { bold: true, fontSize: 10, color: SLATE_DARK, fill: { color: 'F1F5F9' }, align: 'right' as const } }
  ];

  const botRows: any[] = [botTableHeaders];

  const getRedPillColor = (score: number) => {
    if (score <= -4.0) return 'E53E3E';
    if (score <= -2.4) return 'F56565';
    if (score <= -1.5) return 'FEB2B2';
    return 'FED7D7';
  };

  bottomTopics.forEach((t) => {
    botRows.push([
      { 
        text: t.name, 
        options: { 
          bold: true, 
          fontSize: 9.5, 
          color: '4338CA', 
          valign: 'middle' as const,
          margin: [6, 4, 6, 6]
        } 
      },
      { 
        text: 'View', 
        options: { 
          bold: true, 
          fontSize: 9, 
          color: '4F46E5', 
          align: 'center' as const, 
          valign: 'middle' as const 
        } 
      },
      { 
        text: `${t.impactScore.toFixed(1)}`, 
        options: { 
          bold: true, 
          fontSize: 10.5, 
          color: SLATE_DARK, 
          align: 'right' as const, 
          valign: 'middle' as const,
          fill: { color: getRedPillColor(t.impactScore) },
          margin: [4, 8, 4, 4]
        } 
      }
    ]);
  });

  slide.addTable(botRows, {
    x: 6.98,
    y: 1.3,
    w: 5.6,
    colW: [3.3, 0.9, 1.4],
    border: { pt: 0.5, color: BORDER_LIGHT },
    rowH: [0.35, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55]
  });

  // Footer Note
  slide.addText('Some content is generated by AI | DHL Express Cambodia VoC Driver Analysis', {
    x: 0.6,
    y: 6.85,
    w: 8.0,
    h: 0.3,
    fontSize: 8.5,
    color: '94A3B8',
    fontFace: 'Arial'
  });

  slide.addText(`Page ${slideNumber}`, {
    x: 11.5,
    y: 6.85,
    w: 1.2,
    h: 0.3,
    fontSize: 9,
    color: '94A3B8',
    fontFace: 'Arial',
    align: 'right'
  });
}

// =========================================================================
// 3. SLIDE 3: TEXT ANALYTICS SUMMARY MATRIX (SCREENSHOT 2 REPLICA)
// =========================================================================
function addTextAnalyticsSummarySlide(
  pres: pptxgen,
  parentTopics: TopicAnalyticsItem[],
  overallMetrics: any,
  slideNumber: number
) {
  const slide = pres.addSlide();
  slide.background = { color: 'FFFFFF' };

  // Top Yellow Accent Line
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.1,
    fill: { color: DHL_YELLOW },
    line: { color: DHL_YELLOW }
  });

  // Title
  slide.addText('Text Analytics Summary - Topic Matrix', {
    x: 0.6,
    y: 0.35,
    w: 7.0,
    h: 0.38,
    fontSize: 19,
    bold: true,
    color: SLATE_DARK,
    fontFace: 'Arial'
  });

  slide.addText('Time Period: 06/01/26 to 07/31/26 | Question: Main Score incl. Social', {
    x: 0.6,
    y: 0.75,
    w: 6.5,
    h: 0.22,
    fontSize: 8.5,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });

  // Top Right KPI Summary Card
  const kpiX = 7.7;
  slide.addShape(pres.ShapeType.roundRect, {
    x: kpiX,
    y: 0.32,
    w: 5.0,
    h: 0.68,
    rectRadius: 0.06,
    fill: { color: BG_OFFWHITE },
    line: { color: BORDER_LIGHT, width: 1 }
  });

  slide.addText(`${overallMetrics.overallPosPercent}% Positive (${overallMetrics.totalRecords} recs)`, {
    x: kpiX + 0.15,
    y: 0.44,
    w: 2.6,
    h: 0.4,
    fontSize: 10,
    bold: true,
    color: GREEN_PROMOTER,
    fontFace: 'Arial'
  });

  slide.addText(`${overallMetrics.overallNegPercent}% Negative`, {
    x: kpiX + 2.85,
    y: 0.44,
    w: 2.0,
    h: 0.4,
    fontSize: 10,
    bold: true,
    color: RED_DETRACTOR,
    fontFace: 'Arial'
  });

  // Matrix Table (Spanning full height from y=1.15 down to y=6.6)
  const headers = [
    { text: 'Topic Category', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF', fontSize: 9.5, align: 'left' as const } },
    { text: 'Volume', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF', fontSize: 9.5, align: 'center' as const } },
    { text: 'Vol Change', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF', fontSize: 9.5, align: 'center' as const } },
    { text: '% Responses', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF', fontSize: 9.5, align: 'center' as const } },
    { text: '% Positive', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF', fontSize: 9.5, align: 'center' as const } },
    { text: '% Negative', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF', fontSize: 9.5, align: 'center' as const } },
    { text: 'Impact Score', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF', fontSize: 9.5, align: 'center' as const } }
  ];

  const rows: any[] = [headers];

  parentTopics.slice(0, 11).forEach((pt, idx) => {
    const isPos = pt.impactScore >= 0;
    const rowBg = idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';

    rows.push([
      { 
        text: pt.name, 
        options: { 
          bold: true, 
          fontSize: 9, 
          align: 'left' as const, 
          color: SLATE_DARK, 
          fill: { color: rowBg },
          margin: [5, 6, 5, 8]
        } 
      },
      { 
        text: `${pt.volume}`, 
        options: { 
          fontSize: 9, 
          bold: true,
          align: 'center' as const, 
          color: SLATE_DARK, 
          fill: { color: rowBg } 
        } 
      },
      { 
        text: pt.volumeChange || 'NEW', 
        options: { 
          fontSize: 8.5, 
          align: 'center' as const, 
          color: SLATE_GRAY, 
          fill: { color: rowBg } 
        } 
      },
      { 
        text: `${pt.percentOfResponses}%`, 
        options: { 
          fontSize: 9, 
          align: 'center' as const, 
          color: SLATE_DARK, 
          fill: { color: rowBg } 
        } 
      },
      { 
        text: `${pt.percentPositive}%`, 
        options: { 
          fontSize: 9, 
          align: 'center' as const, 
          color: GREEN_PROMOTER, 
          bold: true, 
          fill: { color: rowBg } 
        } 
      },
      { 
        text: `${pt.percentNegative}%`, 
        options: { 
          fontSize: 9, 
          align: 'center' as const, 
          color: pt.percentNegative > 0 ? RED_DETRACTOR : SLATE_GRAY, 
          bold: pt.percentNegative > 0,
          fill: { color: rowBg } 
        } 
      },
      { 
        text: isPos ? `+${pt.impactScore.toFixed(1)}` : `${pt.impactScore.toFixed(1)}`, 
        options: { 
          fontSize: 9.5, 
          bold: true, 
          align: 'center' as const, 
          color: isPos ? GREEN_PROMOTER : RED_DETRACTOR, 
          fill: { color: isPos ? 'DCFCE7' : 'FEE2E2' },
          margin: [3, 4, 3, 4]
        } 
      }
    ]);
  });

  slide.addTable(rows, {
    x: 0.6,
    y: 1.15,
    w: 12.13,
    colW: [3.13, 1.2, 1.3, 1.6, 1.6, 1.6, 1.7],
    border: { pt: 0.5, color: BORDER_LIGHT },
    rowH: [0.36, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45]
  });

  // Footer
  slide.addText('DHL Express Cambodia | VoC Text Analytics Topic Distribution Matrix', {
    x: 0.6,
    y: 6.85,
    w: 8.0,
    h: 0.3,
    fontSize: 8.5,
    color: '94A3B8',
    fontFace: 'Arial'
  });

  slide.addText(`Page ${slideNumber}`, {
    x: 11.5,
    y: 6.85,
    w: 1.2,
    h: 0.3,
    fontSize: 9,
    color: '94A3B8',
    fontFace: 'Arial',
    align: 'right'
  });
}

// =========================================================================
// 4. SLIDE 4: ICCC+ EXECUTIVE SLIDE (PERFECT FIT & PROPORTIONS)
// =========================================================================
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

  // Top Yellow Accent Line
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.1,
    fill: { color: DHL_YELLOW },
    line: { color: DHL_YELLOW }
  });

  // Top Header: FOR INTERNAL USE
  slide.addText('FOR INTERNAL USE', {
    x: 0.6,
    y: 0.28,
    w: 4.0,
    h: 0.2,
    fontSize: 8.5,
    bold: true,
    color: '94A3B8',
    fontFace: 'Arial'
  });

  // Main Slide Title: ICCC+ - Top and Bottom Topics (Red Headline)
  slide.addText('ICCC+ - Top and Bottom Topics', {
    x: 0.6,
    y: 0.52,
    w: 8.0,
    h: 0.45,
    fontSize: 22,
    bold: true,
    color: DHL_RED,
    fontFace: 'Arial'
  });

  // Top Right ICCC+ Brand Badge
  slide.addText('ICCC+', {
    x: 11.5,
    y: 0.45,
    w: 1.2,
    h: 0.4,
    fontSize: 20,
    bold: true,
    color: DHL_RED,
    fontFace: 'Arial',
    align: 'right'
  });

  // =========================================================================
  // TOP SECTION: MINI BARS (LEFT) & METRIC CARDS (RIGHT) (y: 1.05 to y: 2.30)
  // =========================================================================

  // Mini Chart Left: Top Topics Impact (Green)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.6,
    y: 1.05,
    w: 3.9,
    h: 1.22,
    rectRadius: 0.04,
    fill: { color: 'F8FAFC' },
    line: { color: BORDER_LIGHT, width: 0.8 }
  });
  slide.addText('Top Topics Impact', {
    x: 0.7,
    y: 1.10,
    w: 3.7,
    h: 0.18,
    fontSize: 8,
    bold: true,
    color: GREEN_PROMOTER,
    fontFace: 'Arial'
  });

  topTopics.slice(0, 4).forEach((t, idx) => {
    const bx = 0.72 + idx * 0.92;
    const bh = Math.min(0.55, Math.max(0.20, (t.impactScore / 8) * 0.55));
    // Bar
    slide.addShape(pres.ShapeType.rect, {
      x: bx,
      y: 1.82 - bh,
      w: 0.72,
      h: bh,
      fill: { color: '22C55E' },
      line: { color: '16A34A', width: 0.5 }
    });
    // Label
    const displayLabel = t.subTopic || t.name.replace(/.*-\s*/, '');
    slide.addText(displayLabel, {
      x: bx - 0.08,
      y: 1.84,
      w: 0.88,
      h: 0.38,
      fontSize: 6.5,
      color: SLATE_GRAY,
      align: 'center',
      fontFace: 'Arial'
    });
  });

  // Mini Chart Center-Left: Bottom Topics Impact (Red)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 4.65,
    y: 1.05,
    w: 3.9,
    h: 1.22,
    rectRadius: 0.04,
    fill: { color: 'F8FAFC' },
    line: { color: BORDER_LIGHT, width: 0.8 }
  });
  slide.addText('Bottom Topics Impact', {
    x: 4.75,
    y: 1.10,
    w: 3.7,
    h: 0.18,
    fontSize: 8,
    bold: true,
    color: RED_DETRACTOR,
    fontFace: 'Arial'
  });

  bottomTopics.slice(0, 4).forEach((t, idx) => {
    const bx = 4.77 + idx * 0.92;
    const bh = Math.min(0.55, Math.max(0.20, (Math.abs(t.impactScore) / 6) * 0.55));
    // Bar
    slide.addShape(pres.ShapeType.rect, {
      x: bx,
      y: 1.32,
      w: 0.72,
      h: bh,
      fill: { color: 'EF4444' },
      line: { color: 'DC2626', width: 0.5 }
    });
    // Label
    const displayLabel = t.subTopic || t.name.replace(/.*-\s*/, '');
    slide.addText(displayLabel, {
      x: bx - 0.08,
      y: 1.34 + bh,
      w: 0.88,
      h: 0.38,
      fontSize: 6.5,
      color: SLATE_GRAY,
      align: 'center',
      fontFace: 'Arial'
    });
  });

  // Right Side Metrics (from Screenshot 3)
  const metricBoxX = 8.75;
  slide.addShape(pres.ShapeType.roundRect, {
    x: metricBoxX,
    y: 1.05,
    w: 3.98,
    h: 1.22,
    rectRadius: 0.04,
    fill: { color: 'F8FAFC' },
    line: { color: BORDER_LIGHT, width: 0.8 }
  });

  // 96.1% Positive
  slide.addText('96.1%', {
    x: metricBoxX + 0.15,
    y: 1.20,
    w: 1.2,
    h: 0.45,
    fontSize: 22,
    bold: true,
    color: GREEN_PROMOTER,
    fontFace: 'Arial'
  });
  slide.addText('Positive\n293 records', {
    x: metricBoxX + 1.35,
    y: 1.24,
    w: 1.0,
    h: 0.4,
    fontSize: 8,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });

  // 3.6% Negative
  slide.addText('3.6%', {
    x: metricBoxX + 2.35,
    y: 1.20,
    w: 0.85,
    h: 0.45,
    fontSize: 22,
    bold: true,
    color: RED_DETRACTOR,
    fontFace: 'Arial'
  });
  slide.addText('Negative\n11 records', {
    x: metricBoxX + 3.15,
    y: 1.24,
    w: 0.75,
    h: 0.4,
    fontSize: 8,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });

  // Neutral / Mixed subtext
  slide.addText('0.3% Mixed Opinion        8.5% Neutral', {
    x: metricBoxX + 0.15,
    y: 1.82,
    w: 3.7,
    h: 0.25,
    fontSize: 8.5,
    color: SLATE_GRAY,
    fontFace: 'Arial'
  });

  // =========================================================================
  // BOTTOM SECTION: TOP 3 TOPICS & BOTTOM 3 TOPICS TABLES (y: 2.40 to y: 6.60)
  // Perfectly spanning canvas with generous padding and legible typography
  // =========================================================================
  const tableY = 2.40;
  const tableW = 5.95;

  // LEFT TABLE: TOP 3 TOPICS (GREEN BANNER)
  const topTableRows: any[] = [
    [
      { 
        text: 'TOP 3 TOPICS', 
        options: { 
          colspan: 2, 
          bold: true, 
          fill: { color: '059669' }, 
          color: 'FFFFFF', 
          fontSize: 11, 
          align: 'center' as const,
          margin: [6, 4, 6, 4]
        } 
      }
    ],
    [
      { 
        text: 'Topics', 
        options: { 
          bold: true, 
          fill: { color: 'F1F5F9' }, 
          color: SLATE_DARK, 
          fontSize: 9.5, 
          align: 'left' as const,
          margin: [5, 6, 5, 8]
        } 
      },
      { 
        text: 'Key Highlights', 
        options: { 
          bold: true, 
          fill: { color: 'F1F5F9' }, 
          color: SLATE_DARK, 
          fontSize: 9.5, 
          align: 'left' as const,
          margin: [5, 6, 5, 8]
        } 
      }
    ]
  ];

  highlights.top3.forEach((h, idx) => {
    const rowBg = idx % 2 === 0 ? 'FFFFFF' : 'FAFAFA';
    const highlightItems = h.subTopicHighlights.map(sh => `${sh.aspect}: ${sh.summary}`).join('\n\n');

    topTableRows.push([
      { 
        text: h.topic, 
        options: { 
          bold: true, 
          fontSize: 9.5, 
          color: SLATE_DARK, 
          valign: 'top' as const,
          fill: { color: rowBg },
          margin: [8, 6, 8, 8]
        } 
      },
      { 
        text: highlightItems, 
        options: { 
          fontSize: 8.5, 
          color: SLATE_DARK, 
          valign: 'top' as const,
          fill: { color: rowBg },
          margin: [8, 8, 8, 8],
          lineSpacing: 13
        } 
      }
    ]);
  });

  slide.addTable(topTableRows, {
    x: 0.6,
    y: tableY,
    w: tableW,
    colW: [1.35, 4.60],
    border: { pt: 0.5, color: BORDER_LIGHT },
    rowH: [0.38, 0.32, 1.25, 1.25, 1.25]
  });

  // RIGHT TABLE: BOTTOM 3 TOPICS (RED BANNER)
  const botTableRows: any[] = [
    [
      { 
        text: 'BOTTOM 3 TOPICS', 
        options: { 
          colspan: 2, 
          bold: true, 
          fill: { color: 'DC2626' }, 
          color: 'FFFFFF', 
          fontSize: 11, 
          align: 'center' as const,
          margin: [6, 4, 6, 4]
        } 
      }
    ],
    [
      { 
        text: 'Topics', 
        options: { 
          bold: true, 
          fill: { color: 'F1F5F9' }, 
          color: SLATE_DARK, 
          fontSize: 9.5, 
          align: 'left' as const,
          margin: [5, 6, 5, 8]
        } 
      },
      { 
        text: 'Key Highlights', 
        options: { 
          bold: true, 
          fill: { color: 'F1F5F9' }, 
          color: SLATE_DARK, 
          fontSize: 9.5, 
          align: 'left' as const,
          margin: [5, 6, 5, 8]
        } 
      }
    ]
  ];

  highlights.bottom3.forEach((h, idx) => {
    const rowBg = idx % 2 === 0 ? 'FFFFFF' : 'FAFAFA';
    const highlightItems = h.subTopicHighlights.map(sh => `${sh.aspect}: ${sh.summary}`).join('\n\n');

    botTableRows.push([
      { 
        text: h.topic, 
        options: { 
          bold: true, 
          fontSize: 9.5, 
          color: SLATE_DARK, 
          valign: 'top' as const,
          fill: { color: rowBg },
          margin: [8, 6, 8, 8]
        } 
      },
      { 
        text: highlightItems, 
        options: { 
          fontSize: 8.5, 
          color: SLATE_DARK, 
          valign: 'top' as const,
          fill: { color: rowBg },
          margin: [8, 8, 8, 8],
          lineSpacing: 13
        } 
      }
    ]);
  });

  slide.addTable(botTableRows, {
    x: 6.78,
    y: tableY,
    w: tableW,
    colW: [1.35, 4.60],
    border: { pt: 0.5, color: BORDER_LIGHT },
    rowH: [0.38, 0.32, 1.25, 1.25, 1.25]
  });

  // Footer: DHL Express Cambodia | ICCC+ Bi-Monthly Meeting & Slide Number 4
  slide.addText('DHL Express Cambodia | ICCC+ Bi-Monthly Meeting', {
    x: 0.6,
    y: 6.90,
    w: 6.0,
    h: 0.25,
    fontSize: 8.5,
    color: '64748B',
    fontFace: 'Arial'
  });

  slide.addText('4', {
    x: 12.13,
    y: 6.90,
    w: 0.6,
    h: 0.25,
    fontSize: 9,
    bold: true,
    color: '64748B',
    fontFace: 'Arial',
    align: 'right'
  });
}
