import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { getUserId } from "../utils";
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = createDynamoDBClient()

const table = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body)

  const timestamp = new Date().toISOString();
  const todoId = uuidv4()
  const userId = getUserId(event)

  const newItem = {
    todoId,
    userId,
    timestamp,
    ...newTodo
  }

  console.log(newItem);

  await docClient.put({
    TableName: table,
    Item: newItem
  }).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ newItem }),
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  };
}

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