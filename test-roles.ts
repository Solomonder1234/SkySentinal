import * as noblox from 'noblox.js';
async function test() {
    const roles = await noblox.getRoles(33919343);
    console.log(roles.map(r => `Rank ${r.rank}: ${r.name}`).join('\n'));
}
test();
