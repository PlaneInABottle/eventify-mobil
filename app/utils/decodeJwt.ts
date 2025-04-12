import { jwtDecode } from "jwt-decode"

export const decodeJwt = (token: string) => {
  const decodedToken = jwtDecode(token)
  console.log(decodedToken, " Decoded Token:")
  return decodedToken
}
