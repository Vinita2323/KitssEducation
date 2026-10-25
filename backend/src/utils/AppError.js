export class AppError extends Error {
  constructor(status, code, message, { fields, cause } = {}) {
    super(message, { cause });
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
