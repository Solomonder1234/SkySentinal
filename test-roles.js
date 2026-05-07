const noblox = require('/Users/leobernstein/Desktop/FTA-Bot/node_modules/noblox.js');
async function test() {
    try {
        const roles = await noblox.getRoles(33919343);
        console.log(roles.map(r => `Rank ${r.rank}: ${r.name}`).join('\n'));
    } catch(e) { console.error(e); }
}
test();
