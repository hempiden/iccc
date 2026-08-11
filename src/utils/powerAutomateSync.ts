import { VoCRecord } from '../types';

export interface PowerAutomateConfig {
  webhookUrl: string;
  autoSyncEnabled: boolean;
  lastSyncTime?: string;
  lastSyncStatus?: 'success' | 'failed' | 'idle';
  lastSyncMessage?: string;
}

const STORAGE_KEY = 'dhl_power_automate_config';

export function getPowerAutomateConfig(): PowerAutomateConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse Power Automate config:', e);
  }
  return {
    webhookUrl: '',
    autoSyncEnabled: true,
    lastSyncStatus: 'idle',
    lastSyncMessage: 'No webhook URL configured yet.'
  };
}

export function savePowerAutomateConfig(config: PowerAutomateConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// Complete JSON Schema for Power Automate "When an HTTP request is received" trigger
export const POWER_AUTOMATE_JSON_SCHEMA = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "properties": {
    "action": { "type": "string" },
    "timestamp": { "type": "string" },
    "sourceApp": { "type": "string" },
    "recordCount": { "type": "integer" },
    "record": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "customerName": { "type": "string" },
        "surveyDate": { "type": "string" },
        "score": { "type": "number" },
        "rating": { "type": "string" },
        "status": { "type": "string" },
        "rootCause": { "type": "string" },
        "followUpComments": { "type": "string" },
        "owner": { "type": "string" },
        "facility": { "type": "string" },
        "waybillNumber": { "type": "string" },
        "accountNumber": { "type": "string" },
        "feedbackText": { "type": "string" },
        "alertType": { "type": "string" },
        "interaction": { "type": "string" },
        "deadline": { "type": "string" }
      }
    },
    "records": {
      "type": "array",
      "items": { "type": "object" }
    }
  },
  "required": ["action", "timestamp", "sourceApp"]
};

/**
 * Executes an HTTP POST request to the configured Power Automate Webhook URL
 */
export async function sendPowerAutomatePayload(
  payload: any,
  overrideUrl?: string
): Promise<{ success: boolean; message: string }> {
  const config = getPowerAutomateConfig();
  const targetUrl = overrideUrl || config.webhookUrl;

  if (!targetUrl || !targetUrl.trim()) {
    return {
      success: false,
      message: 'No Power Automate Webhook URL configured. Please paste your HTTP POST URL in the Superadmin Command Center.'
    };
  }

  try {
    const response = await fetch(targetUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok || response.status === 202 || response.status === 200) {
      const nowStr = new Date().toLocaleString();
      const updatedConfig: PowerAutomateConfig = {
        ...config,
        lastSyncTime: nowStr,
        lastSyncStatus: 'success',
        lastSyncMessage: `Successfully delivered trigger to Power Automate (${response.status} ${response.statusText}).`
      };
      savePowerAutomateConfig(updatedConfig);
      return {
        success: true,
        message: `Webhook triggered successfully! Power Automate received event (${response.status}).`
      };
    } else {
      const text = await response.text().catch(() => '');
      const errMsg = `Power Automate returned status ${response.status}: ${text || response.statusText}`;
      const updatedConfig: PowerAutomateConfig = {
        ...config,
        lastSyncTime: new Date().toLocaleString(),
        lastSyncStatus: 'failed',
        lastSyncMessage: errMsg
      };
      savePowerAutomateConfig(updatedConfig);
      return { success: false, message: errMsg };
    }
  } catch (err: any) {
    const errMsg = err?.message || 'Failed to reach Power Automate endpoint. Check network or CORS configuration.';
    const updatedConfig: PowerAutomateConfig = {
      ...config,
      lastSyncTime: new Date().toLocaleString(),
      lastSyncStatus: 'failed',
      lastSyncMessage: errMsg
    };
    savePowerAutomateConfig(updatedConfig);
    return { success: false, message: errMsg };
  }
}

/**
 * Triggers Power Automate for a single VoC Record modification or creation
 */
export async function syncRecordToPowerAutomate(record: VoCRecord, action: 'UPDATE' | 'CREATE' | 'DELETE' = 'UPDATE') {
  const config = getPowerAutomateConfig();
  if (!config.autoSyncEnabled || !config.webhookUrl) return;

  const payload = {
    action,
    timestamp: new Date().toISOString(),
    sourceApp: 'DHL VoC Management Portal',
    recordCount: 1,
    record: {
      id: record.id,
      surveyId: record.surveyId || record.id,
      customerName: record.customerName || '',
      surveyDate: record.responseDate || record.creationDate || '',
      likelihood: record.likelihood,
      category: record.category || '',
      status: record.status || 'New',
      rootCause: record.actionSummary || '',
      followUpComments: record.followUpComments || '',
      owner: record.owner || '',
      interaction: record.interaction || '',
      comment: record.comment || '',
      alertType: record.alertType || '',
      deadline: record.deadline || ''
    }
  };

  // Fire and forget, or handle in background
  sendPowerAutomatePayload(payload).catch(err => {
    console.warn('Background Power Automate sync failed:', err);
  });
}

/**
 * Syncs a batch of records (e.g. after fresh excel upload) to Power Automate
 */
export async function syncBatchToPowerAutomate(records: VoCRecord[], action = 'BATCH_UPLOAD') {
  const config = getPowerAutomateConfig();
  if (!config.webhookUrl) {
    return { success: false, message: 'No Power Automate Webhook URL set.' };
  }

  const payload = {
    action,
    timestamp: new Date().toISOString(),
    sourceApp: 'DHL VoC Management Portal',
    recordCount: records.length,
    records: records.map(r => ({
      id: r.id,
      surveyId: r.surveyId || r.id,
      customerName: r.customerName || '',
      surveyDate: r.responseDate || r.creationDate || '',
      likelihood: r.likelihood,
      category: r.category || '',
      status: r.status || 'New',
      rootCause: r.actionSummary || '',
      followUpComments: r.followUpComments || '',
      owner: r.owner || '',
      interaction: r.interaction || '',
      comment: r.comment || '',
      alertType: r.alertType || ''
    }))
  };

  return sendPowerAutomatePayload(payload);
}
