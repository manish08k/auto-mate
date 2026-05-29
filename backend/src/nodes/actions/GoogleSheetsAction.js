import { BaseNode } from '../base/BaseNode.js';
import { google } from 'googleapis';

export class GoogleSheetsAction extends BaseNode {
  static type               = 'googleSheets';
  static displayName        = 'Google Sheets';
  static category           = 'action';
  static icon               = 'table';
  static color              = '#34A853';
  static description        = 'Read, append, update, and clear Google Sheets data.';
  static requiresCredential = true;
  static credentialProvider = 'google';

  defineParams() {
    return [
      {
        key: 'operation', label: 'Operation', type: 'select', required: true, default: 'appendRow',
        options: [
          { label: 'Append Row',    value: 'appendRow'    },
          { label: 'Get Rows',      value: 'getRows'      },
          { label: 'Update Row',    value: 'updateRow'    },
          { label: 'Clear Range',   value: 'clearRange'   },
          { label: 'Create Sheet',  value: 'createSheet'  },
        ],
      },
      { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'string', required: true,  placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms' },
      { key: 'sheetName',     label: 'Sheet / tab name', type: 'string', required: false, default: 'Sheet1' },
      { key: 'range',         label: 'Range',  type: 'string', required: false, default: 'A:Z', placeholder: 'A1:D100' },
      { key: 'values',        label: 'Row values (JSON array)', type: 'json', required: false,
        placeholder: '["John", "john@co.com", "2024-01-01"]', description: 'Array of cell values for append/update.' },
      { key: 'rowIndex',      label: 'Row number (update)', type: 'number', required: false, placeholder: '2' },
      { key: 'hasHeaders',    label: 'First row is header', type: 'boolean', required: false, default: true },
      { key: 'newSheetTitle', label: 'New sheet title (create)', type: 'string', required: false },
    ];
  }

  validate(params) {
    if (!params.spreadsheetId) return '"Spreadsheet ID" is required';
    if (params.operation === 'appendRow' && !params.values) return '"Row values" is required for append';
    if (params.operation === 'updateRow' && !params.values) return '"Row values" is required for update';
    if (params.operation === 'updateRow' && !params.rowIndex) return '"Row number" is required for update';
    if (params.operation === 'createSheet' && !params.newSheetTitle) return '"New sheet title" is required';
    return null;
  }

  async execute(params, context, credential) {
    const auth   = this._buildAuth(credential);
    const sheets = google.sheets({ version: 'v4', auth });
    const tab    = params.sheetName || 'Sheet1';

    switch (params.operation) {
      case 'appendRow':   return this._appendRow(sheets, params, tab);
      case 'getRows':     return this._getRows(sheets, params, tab);
      case 'updateRow':   return this._updateRow(sheets, params, tab);
      case 'clearRange':  return this._clearRange(sheets, params, tab);
      case 'createSheet': return this._createSheet(sheets, params);
      default: throw new Error(`Unknown Sheets operation: ${params.operation}`);
    }
  }

  async _appendRow(sheets, params, tab) {
    const values = this._parseValues(params.values);
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: params.spreadsheetId,
      range: `${tab}!${params.range || 'A:Z'}`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [values] },
    });
    this.log(`Appended row to ${params.spreadsheetId}`);
    return { updatedRange: res.data.updates?.updatedRange, updatedRows: res.data.updates?.updatedRows };
  }

  async _getRows(sheets, params, tab) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: params.spreadsheetId,
      range: `${tab}!${params.range || 'A:Z'}`,
    });

    const rows = res.data.values || [];

    if (params.hasHeaders && rows.length > 1) {
      const headers = rows[0];
      return {
        rows: rows.slice(1).map((row) =>
          Object.fromEntries(headers.map((h, i) => [h, row[i] ?? null]))
        ),
        headers,
        total: rows.length - 1,
      };
    }

    return { rows, total: rows.length };
  }

  async _updateRow(sheets, params, tab) {
    const values = this._parseValues(params.values);
    const range  = `${tab}!A${params.rowIndex}`;
    const res = await sheets.spreadsheets.values.update({
      spreadsheetId: params.spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });
    this.log(`Updated row ${params.rowIndex}`);
    return { updatedRange: res.data.updatedRange, updatedCells: res.data.updatedCells };
  }

  async _clearRange(sheets, params, tab) {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: params.spreadsheetId,
      range: `${tab}!${params.range || 'A:Z'}`,
    });
    this.log(`Cleared range ${params.range}`);
    return { cleared: true };
  }

  async _createSheet(sheets, params) {
    const res = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: params.spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: params.newSheetTitle } } }],
      },
    });
    const newSheet = res.data.replies?.[0]?.addSheet?.properties;
    this.log(`Created sheet "${params.newSheetTitle}"`);
    return { sheetId: newSheet?.sheetId, title: newSheet?.title };
  }

  _buildAuth(credential) {
    const oauth2 = new google.auth.OAuth2();
    oauth2.setCredentials({ access_token: credential.accessToken, refresh_token: credential.refreshToken });
    return oauth2;
  }

  _parseValues(raw) {
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { return [raw]; }
  }
}