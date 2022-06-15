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

if(targetPath == undefined)
{
    targetPath = sourcePath;
}

let width=-1;
let height=-1;
let format = "";
let fps = 30;

let sameBlock = 0;
let diffBlock = 0;

let oldTexture = null;

fs.readdir(sourcePath, (err, files) => 
{
    let movie = [];

    files.forEach(file => 
    {
        if(path.extname(file) == ".dds")
        {
            console.log(file);

            var data = fs.readFileSync(path.join(sourcePath, file));
            var buffer = Array2Buffer(data);
            var dds = parse(buffer);
            console.log(dds.format + ", " + dds.shape[0] + "x" + dds.shape[1]);

            if(dds.format != "dxt1" && dds.format != "dxt5")
            {
                console.log("Error: Unsupported format! - " + dds.format);
                process.exit(0);
            }
            

            if(format=="")
            {
                format = dds.format;
            }
            else
            {
                if(format!=dds.format)
                {
                    console.log("Error: Different format!");
                    process.exit(0)
                }
            }

            if(width==-1)
            {
                width = dds.shape[0];
                height  = dds.shape[1];
            }
            else
            {
                // size check
                if(width != dds.shape[0] || height != dds.shape[1])
                {
                    console.log("Error: DDS size mismatch!");
                    process.exit(0);
                }
            }

            var image = dds.images[0]
            var texture = new Uint8Array(buffer, image.offset, image.length)
            //console.log(image)  // [ ... mipmap level data ... ]*/

            let blockBytes = 8;
            if(dds.format == "dxt5")
                blockBytes=16;

            for(i=0;i<texture.length;i+=blockBytes)
            {
                let diff = false;

                if(oldTexture==null)
                {
                    diff = true;
                }
                else
                {
                    // same or different?
                    for(j=0;j<blockBytes;j++)
                    {
                        if(oldTexture[i+j]!=texture[i+j])
                        {
                            diff = true;
                            break;
                        }
                    }
                }

                if(diff)
                {
                    diffBlock++;

                    movie.push(0xff); 
                    // push
                    for(j=0;j<blockBytes;j++)
                    {
                        movie.push(texture[i+j]);
                    }
                }
                else
                {
                    sameBlock ++;
                    movie.push(0x00);
                }
            }

            oldTexture = texture;
        }
    });

    console.log("movie.length: " + movie.length);
    console.log("diffBlock = " + diffBlock + "  sameBlock = " + sameBlock);

    let movie8Array = new Uint8Array(movie.length + 20/*header*/);

    // add header
    movie8Array[0] = 68;  // D
    movie8Array[1] = 50;  // 2
    movie8Array[2] = 77;  // M
    movie8Array[3] = 32;  // Space

    // version
    movie8Array[4] = 1;  

    movie8Array[5] = fps;
    
    if(format=='dxt1')
        movie8Array[6]=1;
    if(format=='dxt5')
        movie8Array[6]=5;

    // reserved
    movie8Array[7] = 0;


    let widthByte = Int2Bytes(width);

    // little endian
    movie8Array[8] = widthByte[3];
    movie8Array[9] = widthByte[2];
    movie8Array[10] = widthByte[1];
    movie8Array[11] = widthByte[0];

    let heightByte = Int2Bytes(height);

    movie8Array[12] = heightByte[3];
    movie8Array[13] = heightByte[2];
    movie8Array[14] = heightByte[1];
    movie8Array[15] = heightByte[0];

    // reserved
    movie8Array[16] = 0;
    movie8Array[17] = 0;
    movie8Array[18] = 0;
    movie8Array[19] = 0;

    for(i=0;i<movie.length;i++)
    {
        movie8Array[20+i] = movie[i];
    }

    fs.writeFileSync(path.join(targetPath, "out.d2m"), movie8Array);
});


function Int2Bytes (num) {
    arr = new Uint8Array([
         (num & 0xff000000) >> 24,
         (num & 0x00ff0000) >> 16,
         (num & 0x0000ff00) >> 8,
         (num & 0x000000ff)
    ]);

    return arr;
}

function Array2Buffer(buf) 
{
    const ab = new ArrayBuffer(buf.length);
    const data = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i)
     {
        data[i] = buf[i];
    }
    return ab;
}