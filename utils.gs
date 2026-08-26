function getSheet(name){
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function sheetToObjects(name){
  const ws = getSheet(name);
  if (!ws || ws.getLastRow() < 2) return [];
  const [hdrs, ...rows] = ws.getDataRange().getValues();
  return rows.filter(r => r.some(c => c !== '')).map(r => {
    const o = {}; 
    hdrs.forEach((h, i) => o[h] = r[i]); 
    return o;
  });
}

function nextId(prefix, sheetName, col, padCount = 3){
  const ws = getSheet(sheetName);
  const last = ws.getLastRow();
  if (last < 2) return prefix + String(1).padStart(padCount, '0');
  const ids = ws.getRange(2, col, last - 1, 1).getValues().flat().filter(v => v);
  if (!ids.length) return prefix + String(1).padStart(padCount, '0');
  const nums = ids.map(id => parseInt(String(id).replace(/\D/g, '')) || 0);
  return prefix + String(Math.max(...nums) + 1).padStart(padCount, '0');
}

function fmtDate(d){
  if (!d) return '';
  if (typeof d === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d;
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return String(d);
  return Utilities.formatDate(dt, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function now(){ 
  return new Date(); 
}
