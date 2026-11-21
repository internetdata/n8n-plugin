# [<img src="https://s3.internetdata.io/internetdata-public/brand/mark.svg" alt="InternetData" height="28"/>](https://internetdata.io/) InternetData n8n Node

[![npm](https://img.shields.io/npm/v/n8n-nodes-internetdata)](https://www.npmjs.com/package/n8n-nodes-internetdata)
[![license](https://img.shields.io/github/license/internetdata/n8n-plugin)](LICENSE)

The official [InternetData](https://internetdata.io) node for [n8n](https://n8n.io).

It looks up an IP address, an AS or a domain in a workflow, and works with no key on Unlimited, the free plan.

## Getting Started

In n8n, open Settings > Community Nodes, choose Install, and enter `n8n-nodes-internetdata`. Then add the InternetData node to a workflow. Self-hosted n8n can also take it with `npm install n8n-nodes-internetdata` in `~/.n8n/nodes`.

## Operations

| Resource | Operation | Answers |
|---|---|---|
| IP Address | Look Up | Country, network, company, abuse contact, reverse DNS, Tor, relays and the service flags with no key; VPNs, proxies, hosting, city-level location and the rest with one |
| Autonomous System | Look Up | The AS's registration with no key; its prefixes, peers, upstreams and the domains it hosts with one |
| Domain | Look Up | Whether it's registered and which record types it has with no key; the records, their networks and more with one |

Each answer is the API's JSON as is, one item per input item. The node is usable as a tool by n8n's AI Agent.

## Example Workflow

Paste this into an n8n canvas: a manual trigger, then the InternetData node looking up `8.8.8.8` with no key.

```json
{
  "nodes": [
    {"name": "When clicking 'Execute workflow'", "type": "n8n-nodes-base.manualTrigger", "typeVersion": 1, "position": [0, 0], "parameters": {}},
    {"name": "InternetData", "type": "n8n-nodes-internetdata.internetData", "typeVersion": 1, "position": [220, 0],
     "parameters": {"resource": "ip", "operation": "lookup", "ip": "8.8.8.8"}}
  ],
  "connections": {
    "When clicking 'Execute workflow'": {"main": [[{"node": "InternetData", "type": "main", "index": 0}]]}
  }
}
```

## Credentials

Authentication defaults to None, which answers the free plan's fields. For every field your plan includes, set Authentication to API Key and create an InternetData API credential with a key from the [console](https://app.internetdata.io), with the Lookups scope. The credential's test checks the key without spending a lookup.

## Compatibility

Tested with n8n 2.48.7 (`scripts/e2e.sh`, which runs the node inside n8n's own image).

## Development

`scripts/e2e.sh` builds and lints the node and runs its workflows in `e2e/` against the API, all in Docker. With `INTERNETDATA_KEY` set it also runs the keyed one.

## Other Integrations

There are official InternetData client libraries available for many languages including PHP, Python, Go, Java, and Ruby. See our GitHub at https://github.com/internetdata for more.

## About InternetData

Geolocation, anonymity, ownership, network, service and domain data for any IP address, AS or domain, by API or as databases you download.

[<img src="https://s3.internetdata.io/internetdata-public/brand/mark.svg" alt="InternetData" height="64"/>](https://internetdata.io/)

## License

This project is licensed under the [MIT License](LICENSE).
