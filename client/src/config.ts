// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'a3bhsbjuh2'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`
//export const apiEndpoint = "http://localhost:5000/dev"
export const authConfig = {
  domain: 'luan-test.auth0.com',    // Domain from Auth0
  clientId: '3mwOM5e1Wq5gFiMCdyVJB2Db7Ufbw7CB',  // Client id from an Auth0 application
  callbackUrl: 'http://localhost:3000/callback'
}
