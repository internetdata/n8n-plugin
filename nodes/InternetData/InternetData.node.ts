import type {
    IDataObject,
    IExecuteFunctions,
    IHttpRequestOptions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const BASE_URL = 'https://api.internetdata.io';

type Resource = 'ip' | 'asn' | 'domain';

export class InternetData implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'InternetData',
        name: 'internetData',
        icon: { light: 'file:internetdata.svg', dark: 'file:internetdata.svg' },
        group: ['transform'],
        version: [1],
        subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
        description: 'Look up an IP address, an AS or a domain in InternetData',
        defaults: {
            name: 'InternetData',
        },
        inputs: [NodeConnectionTypes.Main],
        outputs: [NodeConnectionTypes.Main],
        usableAsTool: true,
        credentials: [
            {
                name: 'internetDataApi',
                required: true,
                displayOptions: { show: { authentication: ['apiKey'] } },
            },
        ],
        properties: [
            {
                displayName: 'Authentication',
                name: 'authentication',
                type: 'options',
                options: [
                    {
                        name: 'None',
                        value: 'none',
                        description: 'No key needed to try it. An IP answers its country, AS, hostname, ' +
                            'Tor, relays, anycast and bogon',
                    },
                    {
                        name: 'API Key',
                        value: 'apiKey',
                        description: 'A paid plan or a free key\'s full answers',
                    },
                ],
                default: 'none',
            },
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                options: [
                    { name: 'IP Address', value: 'ip' },
                    { name: 'Autonomous System', value: 'asn' },
                    { name: 'Domain', value: 'domain' },
                ],
                default: 'ip',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['ip'] } },
                options: [
                    {
                        name: 'Look Up',
                        value: 'lookup',
                        description: 'Look up an IPv4 or IPv6 address',
                        action: 'Look up an IP address',
                    },
                ],
                default: 'lookup',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['asn'] } },
                options: [
                    {
                        name: 'Look Up',
                        value: 'lookup',
                        description: 'Look up an autonomous system by its number',
                        action: 'Look up an autonomous system',
                    },
                ],
                default: 'lookup',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['domain'] } },
                options: [
                    {
                        name: 'Look Up',
                        value: 'lookup',
                        description: 'Look up a domain',
                        action: 'Look up a domain',
                    },
                ],
                default: 'lookup',
            },
            {
                displayName: 'IP Address',
                name: 'ip',
                type: 'string',
                required: true,
                default: '',
                placeholder: 'e.g. 8.8.8.8',
                description: 'The IPv4 or IPv6 address to look up',
                displayOptions: { show: { resource: ['ip'] } },
            },
            {
                displayName: 'AS Number',
                name: 'asn',
                type: 'string',
                required: true,
                default: '',
                placeholder: 'e.g. AS15169',
                description: 'The AS number, as AS15169 or 15169',
                displayOptions: { show: { resource: ['asn'] } },
            },
            {
                displayName: 'Domain',
                name: 'domain',
                type: 'string',
                required: true,
                default: '',
                placeholder: 'e.g. example.com',
                description: 'The domain to look up',
                displayOptions: { show: { resource: ['domain'] } },
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const out: INodeExecutionData[] = [];
        for (let i = 0; i < items.length; i++) {
            const resource = this.getNodeParameter('resource', i) as Resource;
            const value = (this.getNodeParameter(resource, i) as string).trim();
            if (value === '') {
                throw new NodeOperationError(this.getNode(), 'Nothing to look up', { itemIndex: i });
            }
            const options: IHttpRequestOptions = {
                method: 'GET',
                url: BASE_URL + lookupPath(resource, value),
                json: true,
            };
            try {
                const answer = this.getNodeParameter('authentication', i) === 'apiKey'
                    ? await this.helpers.httpRequestWithAuthentication.call(this, 'internetDataApi', options)
                    : await this.helpers.httpRequest(options);
                out.push({ json: answer as IDataObject, pairedItem: { item: i } });
            } catch (error) {
                if (this.continueOnFail()) {
                    out.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
                    continue;
                }
                throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
            }
        }
        return [out];
    }
}

function lookupPath(resource: Resource, value: string): string {
    const escaped = encodeURIComponent(value);
    if (resource === 'asn') {
        return `/asn/${escaped}`;
    }
    if (resource === 'domain') {
        return `/domain/${escaped}`;
    }
    return `/${escaped}`;
}
