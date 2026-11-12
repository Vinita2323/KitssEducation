// Standard refund reasons. Codes are stored on refund requests; labels are what people read.
export const refundReasonLabels = { duplicate_charge: 'Charged twice', technical_failure: 'Technical problem', inaccessible_content: 'Content could not be opened' };
export const refundReasonCodes = Object.keys(refundReasonLabels);
export const refundReasonLabel = code => refundReasonLabels[code] ?? code;
