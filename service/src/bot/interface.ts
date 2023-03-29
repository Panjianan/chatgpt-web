import { ChatCompletionRequestMessage } from "openai";

export interface IConfig {
  chatTriggerRule: string;
  disableGroupMessage: boolean;
  temperature: number;
  blockWords: string[];
  chatgptBlockWords: string[];
  chatPrivateTriggerKeyword: string;
}
export interface User {
  username: string,
  chatMessage: Array<any>,
}