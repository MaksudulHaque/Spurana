const fs = require("fs"), cp = require("child_process");
const mjs = fs.readFileSync("build.mjs", "utf8");
const block = mjs.slice(mjs.indexOf("const JS = ["), mjs.indexOf("];", mjs.indexOf("const JS = [")));
const order = [...block.matchAll(/"([^"]+\.js)"/g)].map((m) => m[1]);
const b = order.map((f) => "\n/* " + f + " */\n" + fs.readFileSync("src/" + f, "utf8")).join("\n");
fs.writeFileSync("/tmp/bundle.js", b);
cp.execSync("node --check /tmp/bundle.js");
const o = (b.match(/[{]/g) || []).length, c = (b.match(/[}]/g) || []).length;
console.log("modules:", order.length, "| braces:", o === c ? "ok" : "BAD(" + o + "/" + c + ")");
