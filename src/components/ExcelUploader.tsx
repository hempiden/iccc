import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { VoCRecord } from '../types';
import { parseActionDetails, inferStatus, getNPSCategory, classifyTopic, analyzeSentiment } from '../utils/parser';

interface ExcelUploaderProps {
  onRecordsLoaded: (records: VoCRecord[]) => void;
  onAppendRecords: (records: VoCRecord[]) => void;
  currentCount: number;
}

export default function ExcelUploader({ onRecordsLoaded, onAppendRecords, currentCount }: ExcelUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Helper to find a cell value regardless of header variations
  const findValueByHeader = (row: any, keysToSearch: string[]): any => {
    const rowKeys = Object.keys(row);
    for (const keyToSearch of keysToSearch) {
      const foundKey = rowKeys.find(
        k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === keyToSearch.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (foundKey) {
        return row[foundKey];
      }
    }
    return undefined;
  };

  const processFile = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls' && fileExtension !== 'csv') {
      setStatus({
        type: 'error',
        message: 'Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV file.'
      });
      return;
    }

    setStatus({ type: 'idle', message: '' });
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;

        if (fileExtension === 'csv') {
          const text = new TextDecoder().decode(data as ArrayBuffer);
          workbook = XLSX.read(text, { type: 'string' });
        } else {
          const bytes = new Uint8Array(data as ArrayBuffer);
          workbook = XLSX.read(bytes, { type: 'array' });
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length === 0) {
          setStatus({ type: 'error', message: 'The uploaded file appears to be empty.' });
          return;
        }

        // Map raw JSON to VoCRecord
        const parsedRecords: VoCRecord[] = [];
        let skippedRows = 0;

        rawJson.forEach((row: any, idx) => {
          // Identify columns with smart matching
          const surveyIdVal = findValueByHeader(row, ['Survey ID', 'id', 'SurveyID', 'Survey_ID', 'Interaction', 'Interaction ID']);
          const likelihoodVal = findValueByHeader(row, ['Likelihood', 'likelihood', 'NPS', 'Score', 'rating', 'NPS Score', 'Likelihood to Recommend']);
          const commentVal = findValueByHeader(row, ['Primary Customer Comment (Combined)', 'Primary Customer Comment', 'comment', 'feedback', 'Primary Comment', 'Comments', 'Primary Customer Comment (Translated)']);
          const actionDetailsVal = findValueByHeader(row, ['Action Details', 'Logs', 'ActionDetails', 'Action description', 'All log notes combined (if any)', 'timeline']);
          const ownerVal = findValueByHeader(row, ['Current Follow-up Owner', 'owner', 'staff', 'Follow-up Owner', 'Current Alert Owner', 'Follow up Owner']);
          const interactionVal = findValueByHeader(row, ['Interaction', 'Interaction ID', 'InteractionID', 'Code']);
          const followUpCommentsVal = findValueByHeader(row, ['Follow-up: Customer Comments', 'Followup Comments', 'Customer Comments']);

          // Management & BA Fields Smart Extraction
          const journeyNameVal = findValueByHeader(row, ['Journey Name', 'Journey', 'Journey Name']);
          const momentOfTruthNameVal = findValueByHeader(row, ['Moment Of Truth Name', 'Moment Of Truth', 'MomentOfTruth']);
          const transactionNameVal = findValueByHeader(row, ['Transaction Name', 'Transaction', 'MOT Transaction Type']);
          const easeOfUseVal = findValueByHeader(row, ['Ease Of Use', 'EaseOfUse', 'Ease']);
          const responseDateVal = findValueByHeader(row, ['Responsedate', 'Response Date', 'Date', 'Local Response Date']);
          const creationDateVal = findValueByHeader(row, ['Creationdate', 'Creation Date', 'Local Creation Date']);
          const customerNameVal = findValueByHeader(row, ['Customer Name', 'CustomerName', 'First Call - Updated Customer Name', 'Follow-up Updated Customer Name']);
          const contactPhoneVal = findValueByHeader(row, ['Contact Phone', 'Phone', 'Contact Phone Number', 'First Call - Updated Phone Number', 'Follow-up Updated Phone Number']);
          const contactEmailVal = findValueByHeader(row, ['Contact Email', 'Email', 'Contact Email Address', 'First Call - Updated Email Address', 'Follow-up Updated Email']);
          const countryNameVal = findValueByHeader(row, ['Country name', 'Country', 'Country Code']);
          const regionVal = findValueByHeader(row, ['Region']);
          const industryVal = findValueByHeader(row, ['Industry']);
          const accountNameVal = findValueByHeader(row, ['Account Name', 'AccountName']);
          const awbNumberVal = findValueByHeader(row, ['Combined AWB', 'AWB Number', 'AWB', 'Waybill Number', 'Waybill']);
          const rootCauseCategoryVal = findValueByHeader(row, ['Root Cause Category', 'RootCauseCategory']);
          const rootCauseVal = findValueByHeader(row, ['Root Cause', 'RootCause']);
          const rootCauseCommentVal = findValueByHeader(row, ['Root Cause Comment', 'RootCauseComment']);
          const topicVal = findValueByHeader(row, ['Topic/Theme', 'Topic', 'Theme']);
          const sentimentVal = findValueByHeader(row, ['Sentiment', 'Primary Sentiment']);
          const responseFeedbackChannelVal = findValueByHeader(row, ['Response Feedback Channel', 'ResponseFeedbackChannel', 'Feedback Channel', 'Channel', 'Response Feedback']);

          // Treat missing survey ID as a skip, or generate one
          const surveyId = surveyIdVal ? String(surveyIdVal).trim() : `UPLOAD-${idx + 1}`;
          
          // Parse Likelihood NPS score (default to 5 if empty or invalid)
          let likelihood = 5;
          if (likelihoodVal !== undefined) {
            const parsedScore = parseInt(String(likelihoodVal).trim(), 10);
            if (!isNaN(parsedScore)) {
              likelihood = Math.max(0, Math.min(10, parsedScore));
            }
          }

          const comment = commentVal ? String(commentVal).trim() : 'No comment provided.';
          const actionDetailsRaw = actionDetailsVal ? String(actionDetailsVal).trim() : '';
          const owner = ownerVal ? String(ownerVal).trim() : '(blank)';
          const interaction = interactionVal ? String(interactionVal).trim() : undefined;
          const followUpComments = followUpCommentsVal ? String(followUpCommentsVal).trim() : undefined;

          // Process Ease Of Use score
          let easeOfUse: number | undefined = undefined;
          if (easeOfUseVal !== undefined) {
            const parsedEase = parseInt(String(easeOfUseVal).trim(), 10);
            if (!isNaN(parsedEase)) {
              easeOfUse = Math.max(0, Math.min(10, parsedEase));
            }
          }

          const timeline = parseActionDetails(actionDetailsRaw);
          const statusVal = inferStatus(timeline, actionDetailsRaw);

          // BA Categorization fallbacks
          const transactionName = transactionNameVal ? String(transactionNameVal).trim() : 'Delivery by Courier';
          const topic = topicVal ? String(topicVal).trim() : classifyTopic(comment, transactionName);
          
          // Generate a truly unique database ID in case of multiple rows for the same survey ID (split by theme)
          const cleanTopic = topic ? topic.replace(/[^a-zA-Z0-9]/g, '_') : 'General';
          const id = `${surveyId}_${cleanTopic}`;
          
          let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'NO_OPINION' = 'NO_OPINION';
          if (sentimentVal) {
            const sText = String(sentimentVal).toUpperCase().trim();
            if (sText.includes('POS')) sentiment = 'POSITIVE';
            else if (sText.includes('NEG')) sentiment = 'NEGATIVE';
            else if (sText.includes('NEU')) sentiment = 'NEUTRAL';
          } else {
            sentiment = analyzeSentiment(comment, likelihood);
          }

          parsedRecords.push({
            id,
            surveyId,
            likelihood,
            category: getNPSCategory(likelihood),
            comment,
            actionDetailsRaw,
            timeline,
            owner,
            status: statusVal,
            interaction,
            followUpComments,
            // Extended Mapped columns:
            journeyName: journeyNameVal ? String(journeyNameVal).trim() : undefined,
            momentOfTruthName: momentOfTruthNameVal ? String(momentOfTruthNameVal).trim() : undefined,
            transactionName,
            easeOfUse,
            responseDate: responseDateVal ? String(responseDateVal).trim() : undefined,
            creationDate: creationDateVal ? String(creationDateVal).trim() : undefined,
            customerName: customerNameVal ? String(customerNameVal).trim() : undefined,
            contactPhone: contactPhoneVal ? String(contactPhoneVal).trim() : undefined,
            contactEmail: contactEmailVal ? String(contactEmailVal).trim() : undefined,
            countryName: countryNameVal ? String(countryNameVal).trim() : undefined,
            region: regionVal ? String(regionVal).trim() : undefined,
            industry: industryVal ? String(industryVal).trim() : undefined,
            accountName: accountNameVal ? String(accountNameVal).trim() : undefined,
            awbNumber: awbNumberVal ? String(awbNumberVal).trim() : undefined,
            rootCauseCategory: rootCauseCategoryVal ? String(rootCauseCategoryVal).trim() : undefined,
            rootCause: rootCauseVal ? String(rootCauseVal).trim() : undefined,
            rootCauseComment: rootCauseCommentVal ? String(rootCauseCommentVal).trim() : undefined,
            topic,
            sentiment,
            responseFeedbackChannel: responseFeedbackChannelVal ? String(responseFeedbackChannelVal).trim() : undefined
          });
        });

        if (parsedRecords.length === 0) {
          setStatus({ type: 'error', message: 'Could not parse any valid survey rows from the file.' });
          return;
        }

        setStatus({
          type: 'success',
          message: `Successfully parsed ${parsedRecords.length} customer records!`
        });

        // Trigger loading records in main view
        onRecordsLoaded(parsedRecords);

      } catch (err: any) {
        console.error(err);
        setStatus({
          type: 'error',
          message: `Error parsing spreadsheet: ${err.message || 'Unknown error'}`
        });
      }
    };

    reader.onerror = () => {
      setStatus({ type: 'error', message: 'Failed to read the file.' });
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Upload Customer Survey Logs
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Accepts Excel (.xlsx, .xls) and CSV files. Standard columns like 
            <span className="font-mono text-gray-700 bg-gray-50 px-1 py-0.5 rounded mx-1">Survey ID</span>, 
            <span className="font-mono text-gray-700 bg-gray-50 px-1 py-0.5 rounded mx-1">Likelihood</span>, 
            <span className="font-mono text-gray-700 bg-gray-50 px-1 py-0.5 rounded mx-1">Primary Customer Comment (Combined)</span>, and 
            <span className="font-mono text-gray-700 bg-gray-50 px-1 py-0.5 rounded mx-1">Action Details</span> are automatically detected.
          </p>
        </div>
        
        {currentCount > 0 && (
          <div className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg self-start md:self-auto">
            Currently loaded: <span className="text-emerald-700 font-bold">{currentCount}</span> records
          </div>
        )}
      </div>

      <div
        id="file-dropzone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative group cursor-pointer transition-all duration-250 border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center ${
          dragActive
            ? 'border-emerald-500 bg-emerald-50/50'
            : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
        />
        
        <div className={`p-4 rounded-full mb-3 transition-colors duration-250 ${
          dragActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'
        }`}>
          <Upload className="w-8 h-8" />
        </div>

        <p className="text-sm font-medium text-gray-700">
          {dragActive ? 'Drop your file here' : 'Drag and drop your spreadsheet here'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          or click to browse local files
        </p>
      </div>

      {status.type !== 'idle' && (
        <div className={`mt-4 flex items-start gap-3 p-3.5 rounded-xl text-sm border ${
          status.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {status.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{status.message}</span>
        </div>
      )}

      {/* Quick Help Collapsible Panel */}
      <div className="mt-4 bg-slate-50 border border-slate-100/80 rounded-xl p-3.5 text-xs text-slate-600">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          Excel Column Format Guidelines:
        </span>
        <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
          <li><strong>Survey ID:</strong> Number or code, e.g., <code className="bg-white px-1 py-0.5 rounded border border-slate-200">28168109</code></li>
          <li><strong>Likelihood:</strong> NPS score from <code className="bg-white px-1 py-0.5 rounded border border-slate-200">0 to 10</code></li>
          <li><strong>Primary Customer Comment:</strong> The raw text feedback string</li>
          <li><strong>Action Details:</strong> Long string of logs formatted with timestamps in brackets like: <code className="bg-white px-1 py-0.5 rounded border border-slate-200">[2026-06-02 16:58:34] Case Opened;</code></li>
        </ul>
      </div>
    </div>
  );
}
