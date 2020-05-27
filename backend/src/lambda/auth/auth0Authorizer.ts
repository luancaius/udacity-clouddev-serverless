import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
//import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
//import Axios from 'axios'
//import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
// const jwksUrl = '...'
const cert = `-----BEGIN CERTIFICATE-----
MIIDATCCAemgAwIBAgIJLAKSngy3oYduMA0GCSqGSIb3DQEBCwUAMB4xHDAaBgNV
BAMTE2x1YW4tdGVzdC5hdXRoMC5jb20wHhcNMjAwNTA5MTQwMjIwWhcNMzQwMTE2
MTQwMjIwWjAeMRwwGgYDVQQDExNsdWFuLXRlc3QuYXV0aDAuY29tMIIBIjANBgkq
hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuD3F4zWHpUuGbDLmM3X1950we5Ato9K2
WQAMwU4R/UxPq6wfzE/NEUuTsSGU3BWH6MG1PlGv3K/HaLQmh/T/hWWMWjgSTYTV
KudfEV/j5+iwvu9D+BNMvBC5+U2bKTZmOnQmy2qpHQGFQexL6+oYfCjrGeO5Bf7+
z1XRGEERsAabH5MDcvQ8tfj9HAcl3mB6WjTpo/0CJpnY4WGf/9E6BxZtIvFYpYA8
Gh90XxA1BMvhU3LjnxPIKU60DGz+AClGNDJUcfgLTBn/XxvX6iDRi5g3Wrbvj5bA
6oCSTmoOUYd+hIfNGAOVt5/dwC7nxDaq8L5rBDrZCjmj6Y09vzyquwIDAQABo0Iw
QDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBS261Y4KhbN7yi1kOr5DhldYbJa
/jAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBAJSGn9TEjlErWQL1
6TLjI4FyRxHwnEcgjZj7eIl/cjzDoq+F8QyZsNtH0oxjG2EWQF6KCH+QW2JJesTj
/I9L8RoKWh5b7N36JIuGAohhzlK+q548LlYjXgtmeW/oJAirE+Sqx+h2YractSE3
8eMecFB3euwqzrxRGfioOO7PkQviHFzT/hf2JlpJ2OeUUMGFtDgNr4vdTuyFnG9n
XRCzuceLQE29CdK1puinCJNY0+oiz1bX+dQOKDFI/SupGL8Kb+PWxZnmP+0VcALo
0Yi3yEL2zrAHeSYNa4I6tPdcm2AAPqkBSdEkhhlqTVEOik52s0KrOjD9I5J31LnO
v+VZcCw=
-----END CERTIFICATE-----`

export const handler = async (
    event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
    logger.info('Authorizing a user', event.authorizationToken)
    try {
        const jwtToken = await verifyToken(event.authorizationToken)
        logger.info('User was authorized', jwtToken)

        return {
            principalId: jwtToken.sub,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: '*'
                    }
                ]
            }
        }
    } catch (e) {
        logger.error('User not authorized', { error: e.message })

        return {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Deny',
                        Resource: '*'
                    }
                ]
            }
        }
    }
}

// async function verifyToken(authHeader: string): Promise<JwtPayload> {
//     const token = getToken(authHeader)
//     const jwt: Jwt = decode(token, { complete: true }) as Jwt

//     // TODO: Implement token verification
//     // You should implement it similarly to how it was implemented for the exercise for the lesson 5
//     // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
//     return undefined
// }


function verifyToken(authHeader: string): JwtPayload {
    if (!authHeader)
        throw new Error('No auth header')

    if (!authHeader.toLocaleLowerCase().startsWith('bearer'))
        throw new Error('Wrong header')

    const split = authHeader.split(' ')
    const token = split[1]

    return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

// function getToken(authHeader: string): string {
//     if (!authHeader) throw new Error('No authentication header')

//     if (!authHeader.toLowerCase().startsWith('bearer '))
//         throw new Error('Invalid authentication header')

//     const split = authHeader.split(' ')
//     const token = split[1]

//     return token
// }
