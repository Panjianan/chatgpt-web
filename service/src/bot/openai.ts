import DBUtils from "./data.js";
import fs from "fs";
import { ChatCompletionRequestMessageRoleEnum } from "openai";
import { ChatMessage, chatReplyProcess } from "src/chatgpt/index.js";

async function chatgpt(username: string, message: string): Promise<any> {

    // 先将用户输入的消息添加到数据库中
    DBUtils.addUserMessage(username, message)

    // 查找最后一条消息
    const messages = DBUtils.getChatMessage(username)
    let lastMessage = messages?.reverse()?.find(e => e.role === ChatCompletionRequestMessageRoleEnum.Assistant)
    let lastContent = lastMessage && {
        conversationId: lastMessage?.conversationId, // 会话id
        parentMessageId: lastMessage?.messageId, // 上一条消息的id
    }

    // 用户设置的prompt
    const user = DBUtils.getUserByUsername(username);
    let prompt = user.chatMessage.find(
        (msg) => msg.role === ChatCompletionRequestMessageRoleEnum.System
    )!.content + ""

    // web那边的接口会返回conversionid和messageid
    const response: any = await new Promise(async (res, rej) => {
        let resFlag = false;
        let timer
        try {
            await chatReplyProcess({
                message: message,
                lastContext: lastContent,
                systemMessage: prompt,
                process: (chat: ChatMessage) => {
                    if (resFlag) return;
                    // 只能用时间大法了
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        if (!resFlag) res(chat)
                        resFlag = true;
                    }, 2000);
                },
            })
        } catch (e) {
            if (resFlag) return
            console.log("request web api error", e);
            let errorType = Object.prototype.toString.call(e) + "";
            if (errorType.match(/TimeoutError/i)) {
                res({ msg: '请求超时' })
            } else {
                res({ msg: '请求错误' })
            }
            resFlag = true
        }
    })

    if (response?.id) {
        response['code'] = 200
        return response
    } else {
        return { code: -1, msg: response?.msg || "Something went wrong" }
    }
}


export { chatgpt };