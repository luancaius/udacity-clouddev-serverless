import 'source-map-support/register'
import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk'
import { APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = createDynamoDBClient()

const todosTable = process.env.TODOS_TABLE
//const indexName = process.env.INDEX_NAME

export const handler: APIGatewayProxyHandler = async (): Promise<APIGatewayProxyResult> => {


  const result = await docClient.scan({
    TableName: todosTable
  }).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(result.Items),
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  };
}

function createDynamoDBClient() {
  console.log(process.env);

  if (process.env.IS_OFFLINE) {
    console.log('creating dynamodb instance');
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }
  return new XAWS.DynamoDB.DocumentClient()
}