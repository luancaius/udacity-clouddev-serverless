import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { getUserId } from "../utils";
import { TodoService } from '../../services/todoService';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)
    const service = new TodoService();

    const isValidTodoId = await service.todoIdExists(todoId, userId);
    if (!isValidTodoId) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                error: "todo id doesn't exist!"
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            }
        };
    }

    await service.updateTodoAttachment(todoId, userId);

    const url = service.getUploadUrl(todoId);

    return {
        statusCode: 201,
        body: JSON.stringify({
            uploadUrl: url
        }),
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        }
    };
}