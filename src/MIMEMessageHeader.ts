import type { EnvironmentContext } from './MIMEMessage'
import { MIMETextError } from './MIMETextError.js'
import { Mailbox } from './Mailbox.js'

/*
    Headers are based on: https://www.rfc-editor.org/rfc/rfc4021#section-2.1
    (Some are ignored as they can be added later or as a custom header.)
*/

export class MIMEMessageHeader {
    envctx: EnvironmentContext
    fields: HeaderField[] = [
        {
            name: 'Date',
            generator: () => ((new Date()).toUTCString()).replace(/GMT|UTC/gi, '+0000')
        },
        {
            name: 'From',
            required: true,
            validate: (v: unknown) => this.validateMailboxSingle(v),
            dump: (v: unknown) => this.dumpMailboxSingle(v)
        },
        {
            name: 'Sender',
            validate: (v: unknown) => this.validateMailboxSingle(v),
            dump: (v: unknown) => this.dumpMailboxSingle(v)
        },
        {
            name: 'Reply-To',
            validate: (v: unknown) => this.validateMailboxSingle(v),
            dump: (v: unknown) => this.dumpMailboxSingle(v)
        },
        {
            name: 'To',
            validate: (v: unknown) => this.validateMailboxMulti(v),
            dump: (v: unknown) => this.dumpMailboxMulti(v)
        },
        {
            name: 'Cc',
            validate: (v: unknown) => this.validateMailboxMulti(v),
            dump: (v: unknown) => this.dumpMailboxMulti(v)
        },
        {
            name: 'Bcc',
            validate: (v: unknown) => this.validateMailboxMulti(v),
            dump: (v: unknown) => this.dumpMailboxMulti(v)
        },
        {
            name: 'Message-ID',
            generator: () => {
                const randomstr = Math.random().toString(36).slice(2)
                const from: Mailbox = (this.fields.filter((obj) => obj.name === 'From')[0] as HeaderField).value as Mailbox
                const domain = from.getAddrDomain()
                return '<' + randomstr + '@' + domain + '>'
            }
        },
        {
            name: 'Subject',
            required: true,
            dump: (v: unknown) => {
                return typeof v === 'string' ? '=?utf-8?B?' + this.envctx.toBase64(v) + '?=' : ''
            }
        },
        {
            name: 'MIME-Version',
            generator: () => '1.0'
        }
    ]

    constructor (envctx: EnvironmentContext) {
        this.envctx = envctx
    }

    dump (): string {
        let lines = ''

        for (const field of this.fields) {
            if (field.disabled) continue
            const isValueDefinedByUser = field.value !== undefined && field.value !== null
            if (!isValueDefinedByUser && field.required) {
                throw new MIMETextError('MIMETEXT_MISSING_HEADER', `The "${field.name}" header is required.`)
            }
            if (!isValueDefinedByUser && typeof field.generator !== 'function') continue
            if (!isValueDefinedByUser && typeof field.generator === 'function') field.value = field.generator()
            const strval = Object.hasOwn(field, 'dump') && typeof field.dump === 'function'
                ? field.dump(field.value)
                : typeof field.value === 'string' ? field.value : ''
            lines += `${field.name}: ${strval}${this.envctx.eol}`
        }

        return lines.slice(0, -1 * this.envctx.eol.length)
    }

    toObject (): HeadersObject {
        return this.fields.reduce((memo: HeadersObject, item) => {
            memo[item.name] = item.value
            return memo
        }, {})
    }

    get (name: string): string | Mailbox | undefined {
        const fieldMatcher = (obj: HeaderField): boolean => obj.name.toLowerCase() === name.toLowerCase()
        const ind = this.fields.findIndex(fieldMatcher)

        return ind !== -1 ? (this.fields[ind] as HeaderField).value : undefined
    }

    set (name: string, value: any): HeaderField {
        const fieldMatcher = (obj: HeaderField): boolean => obj.name.toLowerCase() === name.toLowerCase()
        const isCustomHeader = !this.fields.some(fieldMatcher)

        if (!isCustomHeader) {
            const ind = this.fields.findIndex(fieldMatcher)
            const field = this.fields[ind] as HeaderField
            if (field.validate && !field.validate(value)) {
                throw new MIMETextError('MIMETEXT_INVALID_HEADER_VALUE', `The value for the header "${name}" is invalid.`)
            }
            (this.fields[ind] as HeaderField).value = value
            return this.fields[ind] as HeaderField
        }

        return this.setCustom({
            name: name,
            value: value,
            custom: true,
            dump: (v: unknown) => typeof v === 'string' ? v : ''
        })
    }

    setCustom (obj: HeaderField): HeaderField {
        if (this.isHeaderField(obj)) {
            if (typeof obj.value !== 'string') {
                throw new MIMETextError('MIMETEXT_INVALID_HEADER_FIELD', 'Custom header must have a value.')
            }
            this.fields.push(obj)
            return obj
        }

        throw new MIMETextError('MIMETEXT_INVALID_HEADER_FIELD', 'Invalid input for custom header. It must be in type of HeaderField.')
    }

    validateMailboxSingle (v: unknown): v is Mailbox {
        return v instanceof Mailbox
    }

    validateMailboxMulti (v: unknown): boolean {
        return v instanceof Mailbox || this.isArrayOfMailboxes(v)
    }

    dumpMailboxMulti (v: unknown): string {
        const dump = (item: Mailbox): string => item.name.length === 0
            ? item.dump()
            : `=?utf-8?B?${this.envctx.toBase64(item.name)}?= <${item.addr}>`
        return this.isArrayOfMailboxes(v) ? v.map(dump).join(`,${this.envctx.eol} `) : v instanceof Mailbox ? dump(v) : ''
    }

    dumpMailboxSingle (v: unknown): string {
        const dump = (item: Mailbox): string => item.name.length === 0
            ? item.dump()
            : `=?utf-8?B?${this.envctx.toBase64(item.name)}?= <${item.addr}>`
        return v instanceof Mailbox ? dump(v) : ''
    }

    isHeaderField (v: unknown): v is HeaderField {
        const validProps = ['name', 'value', 'dump', 'required', 'disabled', 'generator', 'custom']
        if (this.isObject(v)) {
            const h = v as HeaderField
            if (Object.hasOwn(h, 'name') && typeof h.name === 'string' && h.name.length > 0) {
                if (!Object.keys(h).some((prop) => !validProps.includes(prop))) {
                    return true
                }
            }
        }
        return false
    }

    isObject (v: unknown): v is object {
        return (!!v) && (v.constructor === Object)
    }

    isArrayOfMailboxes (v: unknown): v is Mailbox[] {
        return this.isArray(v) && v.every((item) => item instanceof Mailbox)
    }

    isArray (v: unknown): v is any[] {
        return (!!v) && (v.constructor === Array)
    }
}

export class MIMEMessageContentHeader extends MIMEMessageHeader {
    override fields = [
        {
            name: 'Content-ID'
        },
        {
            name: 'Content-Type'
        },
        {
            name: 'Content-Transfer-Encoding'
        },
        {
            name: 'Content-Disposition'
        }
    ]

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor (envctx: EnvironmentContext) {
        super(envctx)
    }
}

export type HeadersObject = Record<string, string | Mailbox | undefined>
export interface HeaderField {
    name: string
    dump?: (v: string | Mailbox | Mailbox[] | undefined) => string
    value?: string | Mailbox | undefined
    validate?: (v: unknown) => boolean
    required?: boolean
    disabled?: boolean
    generator?: () => string
    custom?: boolean
}
