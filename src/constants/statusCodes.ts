const statusCodes = {
  success: 200,
  badRequest: 400,
  queryError: 500,
  notFound: 404,
  badGateway: 502,
  unauthorized: 401,
  userAlreadyExists: 409,
} as const;

export default statusCodes;