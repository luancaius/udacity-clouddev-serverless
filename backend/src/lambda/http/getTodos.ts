import 'source-map-support/register'
import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk'
import { APIGatewayProxyResult, APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda'
import { getUserId } from "../utils";

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = createDynamoDBClient()

const todosTable = process.env.TODOS_TABLE
const globalIndexTodo = process.env.TODO_GLOBAL_INDEX

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  const userId = getUserId(event)

  const result = await docClient.query({
    TableName: todosTable,
    IndexName: globalIndexTodo,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    ScanIndexForward: false
  }).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ items: result.Items }),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
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