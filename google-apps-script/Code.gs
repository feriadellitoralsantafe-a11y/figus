const SPREADSHEET_ID = "REEMPLAZAR_CON_EL_ID_DE_LA_GOOGLE_SHEET";
const SHEET_NAME = "Hoja 1";

const COLUMNS = {
  dni: 1,
  nombreApellido: 2,
  celular: 3,
  figuritas: 4,
  fechaActualizacion: 5,
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = String(data.action || data.accion || "guardarFigus").trim();
    const sheet = getSheet();

    if (action === "buscarPorDni") {
      return buscarPorDni(sheet, data);
    }

    if (action === "guardarFigus") {
      return guardarFigus(sheet, data);
    }

    return jsonResponse({
      success: false,
      error: "Accion no valida.",
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function buscarPorDni(sheet, data) {
  const dni = normalizeDni(data.dni);

  if (!dni) {
    return jsonResponse({
      success: false,
      error: "El DNI es obligatorio.",
    });
  }

  const row = findRowByDni(sheet, dni);

  if (!row) {
    return jsonResponse({
      success: true,
      exists: false,
    });
  }

  return jsonResponse({
    success: true,
    exists: true,
    participante: readParticipante(sheet, row),
  });
}

function guardarFigus(sheet, data) {
  const dni = normalizeDni(data.dni);
  const nombreApellido = String(data.nombreApellido || "").trim();
  const celular = String(data.celular || "").trim();
  const figuritas = normalizeFigus(data.figuritas).join(", ");

  if (!dni || !nombreApellido || !figuritas) {
    return jsonResponse({
      success: false,
      error: "El DNI, el nombre y las figuritas son obligatorios.",
    });
  }

  const fechaActualizacion = new Date();
  const existingRow = findRowByDni(sheet, dni);

  if (existingRow) {
    sheet
      .getRange(existingRow, COLUMNS.nombreApellido, 1, 4)
      .setValues([[nombreApellido, celular, figuritas, fechaActualizacion]]);
  } else {
    sheet.appendRow([dni, nombreApellido, celular, figuritas, fechaActualizacion]);
  }

  return jsonResponse({
    success: true,
    updated: Boolean(existingRow),
    message: existingRow
      ? "Datos actualizados correctamente"
      : "Datos guardados correctamente",
  });
}

function getSheet() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(
    SHEET_NAME,
  );

  if (!sheet) {
    throw new Error('No se encontro la hoja "' + SHEET_NAME + '".');
  }

  return sheet;
}

function findRowByDni(sheet, dni) {
  const lastRow = sheet.getLastRow();

  if (!dni || lastRow < 2) {
    return 0;
  }

  const dniValues = sheet
    .getRange(2, COLUMNS.dni, lastRow - 1, 1)
    .getDisplayValues();
  const matchIndex = dniValues.findIndex(
    ([savedDni]) => normalizeDni(savedDni) === dni,
  );

  return matchIndex === -1 ? 0 : matchIndex + 2;
}

function readParticipante(sheet, row) {
  const values = sheet
    .getRange(row, COLUMNS.dni, 1, COLUMNS.fechaActualizacion)
    .getDisplayValues()[0];

  return {
    dni: normalizeDni(values[COLUMNS.dni - 1]),
    nombreApellido: String(values[COLUMNS.nombreApellido - 1] || "").trim(),
    celular: String(values[COLUMNS.celular - 1] || "").trim(),
    pais: "",
    figuritas: normalizeFigus(values[COLUMNS.figuritas - 1]).join(", "),
  };
}

function normalizeDni(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeFigus(value) {
  const seen = {};

  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => {
      if (seen[entry]) {
        return false;
      }

      seen[entry] = true;
      return true;
    });
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
