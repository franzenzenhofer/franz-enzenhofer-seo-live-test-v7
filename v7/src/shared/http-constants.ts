/**
 * HTTP status code constants and helpers
 * Eliminates magic numbers throughout the codebase
 */

export const HTTP_STATUS = {
  SUCCESS_MIN: 200,
  SUCCESS_MAX: 300,
  REDIRECT_MIN: 300,
  REDIRECT_MAX: 400,
  CLIENT_ERROR_MIN: 400,
  SERVER_ERROR_MIN: 500,
} as const

export const isSuccessStatus = (status: number): boolean =>
  status >= HTTP_STATUS.SUCCESS_MIN && status < HTTP_STATUS.SUCCESS_MAX

export const isRedirectStatus = (status: number): boolean =>
  status >= HTTP_STATUS.REDIRECT_MIN && status < HTTP_STATUS.REDIRECT_MAX

export const isClientError = (status: number): boolean =>
  status >= HTTP_STATUS.CLIENT_ERROR_MIN && status < HTTP_STATUS.SERVER_ERROR_MIN

export const isServerError = (status: number): boolean =>
  status >= HTTP_STATUS.SERVER_ERROR_MIN

export const isErrorStatus = (status: number): boolean =>
  status >= HTTP_STATUS.CLIENT_ERROR_MIN
