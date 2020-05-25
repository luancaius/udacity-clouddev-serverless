import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = createDynamoDBClient()

const table = process.env.TODOS_TABLE

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('creating dynamodb instance');
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }
  return new XAWS.DynamoDB.DocumentClient()
}

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  console.log('deleting todoId ' + todoId);

  const item = await docClient.getItem({
    TableName: table,
    Key: {
      todoId: todoId
    }
  }).promise();


  await docClient.delete({
    TableName: table,
    Key: {
      todoId: todoId,
      timestamp: item.timestamp
    }
  }).promise();

  return {
    statusCode: 200,
    body: `${todoId} deleted`,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  };

  return undefined
}
