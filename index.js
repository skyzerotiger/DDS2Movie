var fs = require("fs");
var path = require("path");
var parse = require('parse-dds')

const args = process.argv.slice(2);
let sourcePath = args[0];
let targetPath = args[1];

if(sourcePath==undefined)
{
    console.log("Usage: node index.js sourcePath targetPath");
    process.exit(0)
}

fs.readdir(sourcePath, (err, files) => 
{
    files.forEach(file => 
    {
        if(path.extname(file) == ".dds")
        {
            console.log(file);

            var data = fs.readFileSync(path.join(sourcePath, file));
            var buffer = ToArrayBuffer(data);
            var dds = parse(buffer);
            console.log(dds.format)  // 'dxt1'
            console.log(dds.shape)   // [ width, height ]
            //console.log(dds.images)  // [ ... mipmap level data ... ]*/
            
            var image = dds.images[0]
        }
    });
});




function ToArrayBuffer(buf) {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}