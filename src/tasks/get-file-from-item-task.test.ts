import { FastifyReply } from "fastify";
import { Item } from "graasp";
import { StatusCodes } from 'http-status-codes'
import { FileItemExtra } from "..";
import GetFileFromItemTask from "./get-file-from-item-task";
import { ITEM_FILE_TXT, ITEM_FOLDER, MEMBER, ROOT_PATH } from '../../test/constants'

const member = MEMBER;
let reply = { status: jest.fn(), type: jest.fn(), header: jest.fn() } as unknown as FastifyReply
const path = ROOT_PATH

describe('GetFileFromItemTask', () => {

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('Successfully download txt file', async () => {
        const item = ITEM_FILE_TXT as Item<FileItemExtra>
        const task = new GetFileFromItemTask(member, { reply, path, item })

        await task.run();

        expect(reply.header).toHaveBeenCalled()
        expect(reply.type).toHaveBeenCalledWith(item.extra.file.mimetype)
        expect(reply.status).not.toHaveBeenCalled()
        expect(task.result).toBeTruthy()
    });

    it('Download folder should fail', async () => {
        const item = ITEM_FOLDER as Item<FileItemExtra>
        const task = new GetFileFromItemTask(member, { reply, path, item })

        await task.run().catch((e) => {
            expect(e.message).toContain('Invalid')
            expect(reply.header).not.toHaveBeenCalled()
            expect(reply.type).not.toHaveBeenCalledWith()
            expect(reply.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
            expect(task.result).toBeFalsy()
        });
    });
})
