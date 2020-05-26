import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import * as AWS from 'aws-sdk';
import { getUserId } from "../utils";
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = createDynamoDBClient()

const table = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  const timestamp = new Date().toISOString();

  const userId = getUserId(event)

  const newItem = {
    todoId,
    userId,
    timestamp,
    ...updatedTodo
  }

  console.log(newItem);

  await docClient.update({
    TableName: table,
    Key: {
      todoId: todoId,
      userId: userId
    },
    ExpressionAttributeValues: {
      ':name': newItem.name,
      ':done': newItem.done,
      ':dueDate': newItem.dueDate,
    },
    ExpressionAttributeNames: {
      "#attrName": "name"
    },
    UpdateExpression: 'SET #attrName=:name, done=:done, dueDate=:dueDate',
    ReturnValues: 'ALL_NEW'
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
