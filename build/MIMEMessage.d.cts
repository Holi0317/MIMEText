import type { Email, MailboxAddrObject, MailboxAddrText, MailboxConfig } from './Mailbox.js';
import { type HeadersObject, MIMEMessageHeader } from './MIMEMessageHeader.js';
import { Mailbox } from './Mailbox.js';
import { MIMEMessageContent } from './MIMEMessageContent.js';
export declare class MIMEMessage {
    envctx: EnvironmentContext;
    headers: MIMEMessageHeader;
    boundaries: Boundaries;
    validTypes: string[];
    validContentTransferEncodings: string[];
    messages: MIMEMessageContent[];
    constructor(envctx: EnvironmentContext);
    asRaw(): string;
    asEncoded(): string;
    dumpTextContent(plaintext: MIMEMessageContent | undefined, html: MIMEMessageContent | undefined, boundary: string): string;
    hasInlineAttachments(): boolean;
    hasAttachments(): boolean;
    getAttachments(): MIMEMessageContent[] | [];
    getInlineAttachments(): MIMEMessageContent[] | [];
    getMessageByType(type: string): MIMEMessageContent | undefined;
    addAttachment(opts: AttachmentOptions): MIMEMessageContent;
    addMessage(opts: ContentOptions): MIMEMessageContent;
    private _addMessage;
    setSender(input: MailboxAddrObject | MailboxAddrText | Email, config?: MailboxConfig): Mailbox;
    getSender(): string | Mailbox | undefined;
    setRecipients(input: MailboxAddrObject | MailboxAddrText | Email | MailboxAddrObject[] | MailboxAddrText[] | Email[], config?: MailboxConfig): Mailbox[];
    getRecipients(config?: MailboxConfig): string | Mailbox | undefined;
    setRecipient(input: MailboxAddrObject | MailboxAddrText | Email | MailboxAddrObject[] | MailboxAddrText[] | Email[], config?: MailboxConfig): Mailbox[];
    setTo(input: MailboxAddrObject | MailboxAddrText | Email | MailboxAddrObject[] | MailboxAddrText[] | Email[], config?: MailboxConfig): Mailbox[];
    setCc(input: MailboxAddrObject | MailboxAddrText | Email | MailboxAddrObject[] | MailboxAddrText[] | Email[], config?: MailboxConfig): Mailbox[];
    setBcc(input: MailboxAddrObject | MailboxAddrText | Email | MailboxAddrObject[] | MailboxAddrText[] | Email[], config?: MailboxConfig): Mailbox[];
    setSubject(value: string): string;
    getSubject(): string | Mailbox | undefined;
    setHeader(name: string, value: any): string;
    getHeader(name: string): string | Mailbox | undefined;
    setHeaders(obj: Record<string, any>): string[];
    getHeaders(): HeadersObject;
    toBase64(v: string): string;
    toBase64WebSafe(v: string): string;
    generateBoundaries(): void;
    isArray(v: unknown): v is any[];
    isObject(v: unknown): v is object;
}
export interface EnvironmentContext {
    toBase64: (v: string) => string;
    toBase64WebSafe: (v: string) => string;
    eol: string;
    validateContentType: (v: string) => string | false;
}
export interface Boundaries {
    mixed: string;
    alt: string;
    related: string;
}
export type ContentTransferEncoding = '7bit' | '8bit' | 'binary' | 'quoted-printable' | 'base64';
export interface ContentHeaders {
    'Content-Type'?: string;
    'Content-Transfer-Encoding'?: ContentTransferEncoding;
    'Content-Disposition'?: string;
    'Content-ID'?: string;
    [index: string]: string | undefined;
}
export interface ContentOptions {
    data: string;
    encoding?: ContentTransferEncoding;
    contentType: string;
    headers?: ContentHeaders;
    charset?: string;
}
export interface AttachmentOptions extends ContentOptions {
    inline?: boolean;
    filename: string;
}
