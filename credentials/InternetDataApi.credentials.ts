import type {
    IAuthenticateGeneric,
    Icon,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class InternetDataApi implements ICredentialType {
    name = 'internetDataApi';

    displayName = 'InternetData API';

    icon: Icon = { light: 'file:internetdata.svg', dark: 'file:internetdata.svg' };

    documentationUrl = 'https://github.com/internetdata/n8n-plugin?tab=readme-ov-file#credentials';

    properties: INodeProperties[] = [
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            required: true,
            description: 'An API key from the InternetData console, with the Lookups scope',
        },
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                Authorization: '=Bearer {{$credentials.apiKey}}',
            },
        },
    };

    // The entitlement answers 401 for a key that is not one, and names the plan
    // behind one that is, without spending a lookup.
    test: ICredentialTestRequest = {
        request: {
            baseURL: 'https://api.internetdata.io',
            url: '/api/v1/entitlement',
            method: 'GET',
        },
    };
}
