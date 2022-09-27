var fs = require("fs");
var path = require("path");
var parse = require('parse-dds')

const args = process.argv.slice(2);

let sourcePath, targetPath;
let fps = 30;


let pathIndex = 0;
for(i=0;i<args.length;i++)
{
    // option check
    if(args[i]=='-h' || args[i]=='--help')
    {
        ShowHelp();
        process.exit(0)
    }
    else if(args[i]=='-fps')
    {
        i++;
        try
        {
            fps = parseInt(args[i]);            
        }
        catch
        {
            console.log("invalid fps option - " + args[i]);
            ShowHelp();
            process.exit(1);
        }
    }
    else
    {
        if(pathIndex==0)
        {
            sourcePath = args[i];
            pathIndex ++;
        }
        if(pathIndex==1)
        {
            targetPath = args[i];
            pathIndex ++;
        }
    }
}

if(sourcePath==undefined)
{
    ShowHelp();
    process.exit(0)
}

if(targetPath == undefined)
{
    targetPath = sourcePath;
}

let width=-1;
let height=-1;
let format = "";


let sameBlock = 0;
let diffBlock = 0;
let upperSameblock = 0;
let lowerSameblock = 0;
let frameCount = 0;

let oldTexture = null;

fs.readdir(sourcePath, (err, files) => 
{
    let movie = [];

    files.forEach(file => 
    {
        if(path.extname(file) == ".dds")
        {
            var data = fs.readFileSync(path.join(sourcePath, file));
            var buffer = Array2Buffer(data);
            var dds = parse(buffer);
            
            if(dds.format != "dxt1" && dds.format != "dxt5")
            {
                console.log("Error: Unsupported format! - " + dds.format);
                process.exit(0);
            }
            
            if(dds.shape[0]  % 4 !=0 || dds.shape[1] % 4 !=0)
            {
                console.log("Error: Width, height must be multiply of 4! - " + dds.format);
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
            console.log(file +", " + dds.format + ", " + dds.shape[0] + "x" + dds.shape[1] );

            let blockBytes = 8;
            if(dds.format == "dxt5")
                blockBytes=16;

            for(i=0;i<texture.length;i+=blockBytes)
            {
                // 0 - all same, 0x01 - upper same, 0x02 - lower same, 0xff - all diff
                let diffType = -1;

                if(oldTexture==null)
                {
                    diffType = 0xff;
                }
                else
                {
                    diffType = 0xff;

                    let allSame = true;
                    for(j=0;j<blockBytes;j++)
                    {
                        if(oldTexture[i+j]!=texture[i+j])
                        {
                            allSame = false;
                            break;
                        }
                    }

                    if(allSame)                    
                    {
                        diffType = 0x00;
                    }
                    else
                    {
                        // upper half
                        let upperSame = true;
                        for(j=0;j<blockBytes/2;j++)
                        {
                            if(oldTexture[i+j]!=texture[i+j])
                            {       
                                upperSame = false;                     
                                break;
                            }
                        }

                        if(upperSame)
                        {
                            diffType = 0x01;
                        }
                        else
                        {
                            // lower half
                            let lowerSame = true;
                            for(j=0;j<blockBytes/2;j++)
                            {
                                if(oldTexture[i+j+blockBytes/2]!=texture[i+j+blockBytes/2])
                                {       
                                    lowerSame = false;                     
                                    break;
                                }
                            }

                            if(upperSame)
                            {
                                diffType = 0x02;
                            }
                        }
                    }
                }

                switch(diffType)
                {
                    case 0x00:
                        sameBlock ++;
                        movie.push(0x00);
                        break;

                    case 0x01:
                        upperSameblock++;
                        movie.push(0x01); 
                        // push lower
                        for(j=blockBytes/2;j<blockBytes;j++)
                        {
                            movie.push(texture[i+j]);
                        }                        
                        break;

                    case 0x02:
                        lowerSameblock++;
                        movie.push(0x02);
                        // push upper
                        for(j=0;j<blockBytes/2;j++)
                        {
                            movie.push(texture[i+j]);
                        }
                        break;

                    case 0xff:
                        diffBlock++;
                        movie.push(0xff); 
                        // push
                        for(j=0;j<blockBytes;j++)
                        {
                            movie.push(texture[i+j]);
                        }
                }
            }

            frameCount++;
            oldTexture = texture;
        }
    });

    console.log("movie.length: " + movie.length + "   diffBlock = " + diffBlock + "  sameBlock = " + sameBlock + "  upperSameblock = " + upperSameblock + "  lowerSameblock = " + lowerSameblock);
    console.log("frameCount = " + frameCount + "   fps = " + fps);

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

    let frameCountByte = Int2Bytes(frameCount);

    movie8Array[16] = frameCountByte[3];
    movie8Array[17] = frameCountByte[2];
    movie8Array[18] = frameCountByte[1];
    movie8Array[19] = frameCountByte[0];

    for(i=0;i<movie.length;i++)
    {
        movie8Array[20+i] = movie[i];
    }

    fs.writeFileSync(path.join(targetPath, "out.d2m"), movie8Array);
    console.log("done! - " + path.join(targetPath, "out.d2m"));
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

function ShowHelp()
{
    console.log("Usage: node index.js fps sourcePath targetPath");
    console.log("option: ");
    console.log("    -fps : Frame per second (Default 30)");
}