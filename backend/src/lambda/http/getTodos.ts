import 'source-map-support/register'
import { APIGatewayProxyResult, APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda'
import { getUserId } from "../utils";
import { TodoService } from '../../services/todoService';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  const userId = getUserId(event)

  const service = new TodoService();
  const result = await service.getItems(userId);

  return {
    statusCode: 200,
    body: JSON.stringify({ items: result }),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    }
  };
}