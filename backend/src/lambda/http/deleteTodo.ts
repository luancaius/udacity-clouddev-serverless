import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk'
import { getUserId } from "../utils";

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = createDynamoDBClient()

const table = process.env.TODOS_TABLE
const localIndex = process.env.TODO_LOCAL_INDEX

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

  const userId = getUserId(event)

  console.log(todoId + ' ' + userId);

  await docClient.delete({
    TableName: table,
    IndexName: localIndex,
    Key: {
      todoId: todoId,
      userId: userId
    }
  }).promise();

  return {
    statusCode: 200,
    body: '',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    }
  };

  return undefined
}
