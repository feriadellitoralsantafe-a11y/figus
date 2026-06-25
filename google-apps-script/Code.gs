const SPREADSHEET_ID = "REEMPLAZAR_CON_EL_ID_DE_LA_GOOGLE_SHEET";
const SHEET_NAME = "Hoja 1";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const dni = String(data.dni || "").trim();
    const nombreApellido = String(data.nombreApellido || "").trim();
    const celular = String(data.celular || "").trim();
    const pais = String(data.pais || "").trim();
    const figuritas = String(data.figuritas || "").trim();

    if (!nombreApellido || !figuritas) {
      return jsonResponse({
        success: false,
        error: "El nombre y las figuritas son obligatorios.",
      });
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(
      SHEET_NAME,
    );

    if (!sheet) {
      throw new Error(`No se encontró la hoja "${SHEET_NAME}".`);
    }

    const fechaActualizacion = new Date();
    const lastRow = sheet.getLastRow();
    let existingRow = 0;

    if (dni && lastRow >= 2) {
      const dniValues = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
      const matchIndex = dniValues.findIndex(
        ([savedDni]) => String(savedDni).trim() === dni,
      );

      if (matchIndex !== -1) {
        existingRow = matchIndex + 2;
      }
    }

    if (existingRow) {
      sheet
        .getRange(existingRow, 2, 1, 4)
        .setValues([
          [nombreApellido, celular, figuritas, fechaActualizacion],
        ]);
    } else {
      sheet.appendRow([
        dni,
        nombreApellido,
        celular,
        figuritas,
        fechaActualizacion,
      ]);
    }

    return jsonResponse({
      success: true,
      updated: Boolean(existingRow),
      message: existingRow
        ? "Datos actualizados correctamente"
        : "Datos guardados correctamente",
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
