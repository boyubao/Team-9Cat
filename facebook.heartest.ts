import * as Debug from 'debug';
import { parsePayloadEvent } from '../bot.util';

let debug: Debug.IDebugger = Debug('heartest');

export function hearTestFunction(keywords: (string | RegExp)[], message: FacebookBotKitMessage): boolean {

  const payload = message.payload || (message.quick_reply ? message.quick_reply.payload : undefined);

  if (payload) {
    const eventParams = parsePayloadEvent(payload);
    debug('payload match test - payload', eventParams);
    for (let i = 0; i < keywords.length; i++) {
      debug('payload match test - keyword', keywords[i]);
      if (typeof keywords[i] === 'string') {
        if ((<string>keywords[i]) === eventParams.name) {
          return true;
        }
      } else {
        if ((<RegExp>keywords[i]).test(eventParams.name)) {
          return true;
        }
      }
    }
  } else if (message.text) {
    debug('text match test - text', message.text);
    for (let i = 0; i < keywords.length; i++) {
      debug('payload match test - keyword', keywords[i]);
      let keyword: RegExp;
      if (typeof (keywords[i]) === 'string') {
        try {
          keyword = new RegExp('^' + keywords[i], 'i');
        } catch (err) {
          debug('invalid regular expression', keywords[i], err);
          return false;
        }
        if (!keyword) {
          return false;
        }
      } else {
        keyword = <RegExp>keywords[i];
      }
      if (keyword.test(message.text)) {
        return true;
      }
    }
  }

  return false;
}