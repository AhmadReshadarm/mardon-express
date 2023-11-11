export enum ErrorCode {
  INTERNAL_ERROR = 'Internal Error',
  ENTITY_NOT_FOUND = 'The requested entity is not found',
  PRODUCT_NOT_FOUND = 'The requested product is not found',
  USER_NOT_FOUND = 'The requested user is not found',
  FORBIDDEN = 'You are forbidden to access this data',
  DUPLICATE_ENTRY = 'Duplicate entry for primary key',
  DYNAMIC_EMPTY_QUERY = 'Query params "from", "to" and "step" should not be empty',
  MAIL_OPTIONS = 'Properties "to", "subject", "html" must be provided',
  VALIDATION_COMMENTS = 'Properties "text" and "reviewId" must be provided',
  VALIDATION_QUESTION_COMMENTS = 'Properties "text" and " questionId" must be provided',
}
