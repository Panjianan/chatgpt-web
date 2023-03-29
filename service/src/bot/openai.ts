import DBUtils from "./data.js";
import fs from "fs";
import { ChatCompletionRequestMessageRoleEnum } from "openai";
import { ChatMessage, chatReplyProcess } from "src/chatgpt/index.js";

async function chatgpt(username: string, message: string): Promise<any> {

    // 先将用户输入的消息添加到数据库中
    DBUtils.addUserMessage(username, message)

    // 查找最后一条消息
    const messages = DBUtils.getChatMessage(username)
    let lastMessageIndex = messages && messages.lastIndexOf(e => e.role == ChatCompletionRequestMessageRoleEnum.Assistant)
    let lastMessage = lastMessageIndex >= 0 ? messages[lastMessageIndex] : null
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
        let timer = setTimeout(() => res({ msg: "超时未响应" }), 5000)
        try {
            await chatReplyProcess({
                message: message,
                lastContext: lastContent,
                systemMessage: prompt,
                process: (chat: ChatMessage) => {
                    // 只能用时间大法了
                    clearTimeout(timer);
                    timer = setTimeout(() => res(chat), 2000);
                },
            })
        } catch (e) {
            console.log("request web api error", e);
            res({ msg: '请求错误' })
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