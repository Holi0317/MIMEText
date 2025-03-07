import { Base64 } from 'js-base64';
import { MIMEMessage } from '../MIMEMessage.js';
const envctx = {
    toBase64: function toBase64(data) {
        return Base64.encode(data);
    },
    toBase64WebSafe: function toBase64WebSafe(data) {
        return Base64.encodeURI(data);
    },
    eol: '\r\n',
    validateContentType: (v) => {
        return v.length > 0 ? v : false;
    }
};
export function createMimeMessage() {
    return new MIMEMessage(envctx);
}
export { MIMEMessage } from '../MIMEMessage.js';
export { Mailbox } from '../Mailbox.js';
export { MIMETextError } from '../MIMETextError.js';
export { MIMEMessageHeader } from '../MIMEMessageHeader.js';
export { MIMEMessageContent } from '../MIMEMessageContent.js';
