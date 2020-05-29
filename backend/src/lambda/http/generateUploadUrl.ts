import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { getUserId } from "../utils";
import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()
const s3 = new XAWS.S3({
    signatureVersion: 'v4'
})

const table = process.env.TODOS_TABLE
const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)

    const isValidTodoId = await todoIdExists(todoId, userId);

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

    await updateTodoAttachment(todoId, userId);

    const url = getUploadUrl(todoId);
    console.log('url = ' + url);

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

function getUploadUrl(id: String) {
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: id,
        Expires: parseInt(urlExpiration)
    })
}

async function updateTodoAttachment(todoId: String, userId: String) {

    await docClient.update({
        TableName: table,
        Key: {
            todoId: todoId,
            userId: userId
        },
        ExpressionAttributeValues: {
            ':attachmentUrl': `https://${bucketName}.s3.amazonaws.com/${todoId}`
        },
        ExpressionAttributeNames: {
            "#attachmentUrl": "attachmentUrl"
        },
        UpdateExpression: 'SET #attachmentUrl=:attachmentUrl',
        ReturnValues: 'ALL_NEW'
    }).promise();
}

async function todoIdExists(todoId: String, userId: String) {
    const result = await docClient.get({
        TableName: table,
        Key: {
            todoId: todoId,
            userId: userId
        }
    }).promise();

    return !!result;
}