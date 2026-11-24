// Reads `n8n execute --rawOutput`'s file and holds each node's first item to
// what the API answers, printing one line per check and exiting 1 on any miss.
import { readFileSync } from 'node:fs';

const [file, kind] = process.argv.slice(2);
const text = readFileSync(file, 'utf8');
const runData = JSON.parse(text.slice(text.indexOf('\n{') + 1)).data.resultData.runData;
let failed = 0;

const checks = kind === 'keyed' ? [
    // A plan whose paid fields are spent answers trial_expired in their place; a keyless answer never carries it.
    ['IP', (j) => j.ip === '146.70.116.130' && (typeof j.is_vpn === 'boolean' || j.trial_expired === true), 'a key answers is_vpn, or trial_expired once its plan is spent'],
    ['Bad IP', (j) => typeof j.error === 'string' && j.error !== '', 'a bad address is an error item'],
    ['Bad key', (j) => /401|invalid API key|Authorization failed/i.test(j.error ?? ''), 'a bad key answers 401'],
] : [
    ['IP', (j) => j.ip === '8.8.8.8' && j.asn?.asn === 15169 && j.is_vpn === undefined, 'keyless IPv4, no is_vpn'],
    ['IPv6', (j) => j.ip === '2606:4700:4700::1111' && j.asn?.asn === 13335, 'keyless IPv6'],
    ['AS', (j) => j.asn === 13335 && typeof j.name === 'string', 'AS13335 by number'],
    ['Domain', (j) => j.domain === 'github.com' && j.is_registered === true, 'github.com is registered'],
];
for (const [node, ok, what] of checks) {
    const json = runData[node]?.[0]?.data?.main?.[0]?.[0]?.json ?? {};
    if (ok(json)) {
        console.log(`ok: ${node}: ${what}`);
    } else {
        failed++;
        console.log(`FAIL: ${node}: ${what}: ${JSON.stringify(json).slice(0, 300)}`);
    }
}
process.exitCode = failed === 0 ? 0 : 1;
