const SHEET_NAME = "Contactos";

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    const payload = JSON.parse(body);

    const name = clean(payload.name);
    const email = clean(payload.email).toLowerCase();
    const phone = clean(payload.phone);
    const message = clean(payload.message);
    const source = clean(payload.source) || "webhook";
    const receivedAt = clean(payload.receivedAt) || new Date().toISOString();

    if (!name || !email || !message) {
      return jsonResponse(400, {
        success: false,
        error: "name, email y message son obligatorios",
      });
    }

    const sheet = getSheet();
    sheet.appendRow([receivedAt, name, email, phone, source, message]);

    return jsonResponse(200, {
      success: true,
      message: "Registro guardado en Google Sheets",
    });
  } catch (error) {
    return jsonResponse(500, {
      success: false,
      error: String(error),
    });
  }
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(["receivedAt", "name", "email", "phone", "source", "message"]);
  }

  return sheet;
}

function jsonResponse(statusCode, payload) {
  const output = ContentService.createTextOutput(JSON.stringify({
    statusCode,
    ...payload,
  }));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
