export class CustomExternalError {
  constructor(public messages: string[], public statusCode: number = 400) {}
}
