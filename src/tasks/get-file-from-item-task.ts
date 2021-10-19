import { Item, Actor } from "graasp";
import contentDisposition from 'content-disposition';
import fs from 'fs';
import type { FastifyReply } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { FileItemExtra, ITEM_TYPE } from "../plugin";
import { BaseTask } from "./base-task";

type InputType = {
    reply?: FastifyReply,
    path?: string,
    item?: Item<FileItemExtra>
}

class GetFileFromItemTask extends BaseTask<unknown>{

    get name(): string {
        return GetFileFromItemTask.name;
    }

    input: InputType
    getInput: () => InputType;

    constructor(actor: Actor, input?: InputType) {
        super(actor)
        this.input = input || {}
    }

    async run(): Promise<void> {
        this.status = 'RUNNING';

        const { reply, path: rootPath, item } = this.input

        if (!item) {
            reply.status(StatusCodes.BAD_REQUEST);
            throw new Error(`Item is not defined`);
        }

        const { id, type, extra: { file } } = item
        this.targetId = id
        if (type !== ITEM_TYPE || !file) {
            reply.status(StatusCodes.BAD_REQUEST);
            throw new Error(`Invalid '${ITEM_TYPE}' item`);
        }

        const { name, path, mimetype } = file;

        reply.type(mimetype);
        // this header will make the browser download the file with 'name' instead of
        // simply opening it and showing it
        reply.header('Content-Disposition', contentDisposition(name));

        this._result = fs.createReadStream(`${rootPath}/${path}`);
        this.status = 'OK';
    }
}


export default GetFileFromItemTask
