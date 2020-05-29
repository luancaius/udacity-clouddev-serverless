import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from "../utils"
import { TodoService } from '../../services/todoService'


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

  const service = new TodoService();
  await service.updateItem(userId, todoId, updatedTodo)

  return {
    statusCode: 200,
    body: JSON.stringify({ newItem }),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    }
  };
}
