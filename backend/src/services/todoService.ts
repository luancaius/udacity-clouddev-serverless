import 'source-map-support/register'
import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk'
import { TodoItem } from '../models/TodoItem';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';

export class TodoService {

    todosTable: string;
    globalIndexTodo: string;
    XAWS: any;
    docClient: any;
    s3Client: any
    localIndex: string
    bucketName: string
    urlExpiration: string
    constructor() {
        console.log('inside todo service - ctor');

        this.XAWS = AWSXRay.captureAWS(AWS)
        this.docClient = this.createDynamoDBClient()
        this.s3Client = new this.XAWS.S3({
            signatureVersion: 'v4'
        })
        this.todosTable = process.env.TODOS_TABLE
        this.globalIndexTodo = process.env.TODO_GLOBAL_INDEX
        this.localIndex = process.env.TODO_LOCAL_INDEX
        this.bucketName = process.env.IMAGES_S3_BUCKET
        this.urlExpiration = process.env.SIGNED_URL_EXPIRATION
    }

    async getItems(userId: string): Promise<TodoItem> {
        console.log('inside todo service - getItem');

        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.globalIndexTodo,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false
        }).promise();

        return result.Items as TodoItem;
    }

    async createItem(todoItem: TodoItem): Promise<TodoItem> {
        console.log('inside todo service - createItem');
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todoItem
        }).promise();
        return todoItem;
    }

    async updateItem(userId: string, todoId: string, updateTodo: UpdateTodoRequest) {
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId
            },
            ExpressionAttributeValues: {
                ':name': updateTodo.name,
                ':done': updateTodo.done,
                ':dueDate': updateTodo.dueDate,
            },
            ExpressionAttributeNames: {
                "#attrName": "name"
            },
            UpdateExpression: 'SET #attrName=:name, done=:done, dueDate=:dueDate',
            ReturnValues: 'ALL_NEW'
        }).promise();
    }

    async deleteItem(userId: string, todoId: string) {
        await this.docClient.delete({
            TableName: this.todosTable,
            IndexName: this.localIndex,
            Key: {
                todoId: todoId,
                userId: userId
            }
        }).promise();
    }

    async updateTodoAttachment(todoId: String, userId: String) {

        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId
            },
            ExpressionAttributeValues: {
                ':attachmentUrl': `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
            },
            ExpressionAttributeNames: {
                "#attachmentUrl": "attachmentUrl"
            },
            UpdateExpression: 'SET #attachmentUrl=:attachmentUrl',
            ReturnValues: 'ALL_NEW'
        }).promise();
    }

    async todoIdExists(todoId: String, userId: String) {
        const result = await this.docClient.get({
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId
            }
        }).promise();

        return !!result;
    }

    getUploadUrl(id: String) {
        return this.s3Client.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: id,
            Expires: parseInt(this.urlExpiration)
        })
    }

    private createDynamoDBClient() {
        console.log(process.env);

        if (process.env.IS_OFFLINE) {
            console.log('creating dynamodb instance');
            return new this.XAWS.DynamoDB.DocumentClient({
                region: 'localhost',
                endpoint: 'http://localhost:8000'
            })
        }
        return new this.XAWS.DynamoDB.DocumentClient()
    }
}