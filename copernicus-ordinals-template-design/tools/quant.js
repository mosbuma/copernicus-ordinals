import fs from 'fs';
import sharp from 'sharp';
import { execSync } from 'child_process';

const TEMP_PNG = 'public/templates/quant-temp.png';
const COMPRESSED_PNG = 'public/templates/quant-compressed.png';

const inputfile = 'public/templates/face.svg'
const outputfile = 'public/templates/face-embedded-quant.svg'


async function svgTo1BitPng(svgPathInput, svgPathOutput) {
  const svgBuffer = fs.readFileSync(svgPathInput);
  
  // Render SVG to PNG
  await sharp(svgBuffer)
    .png({ palette: true })
    .toFile(TEMP_PNG);

  // Use pngquant to reduce to 1-bit (monochrome)
  // execSync(`pngquant --force --ext .png --quality=0-100 --speed 1 --colors 2 ${TEMP_PNG}`);
  execSync(`pngquant --force --quality=0-100 --speed 1 8 ${TEMP_PNG} --output ${COMPRESSED_PNG}`);

  const compressedBuffer = fs.readFileSync(COMPRESSED_PNG);
  const base64 = compressedBuffer.toString('base64');

  // Embed into SVG
  const newSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <image href="data:image/png;base64,${base64}" x="0" y="0" width="256" height="256"/>
</svg>`.trim();

  fs.writeFileSync(svgPathOutput, newSvg);
  console.log('Done: final.svg with optimized 1-bit PNG.');
}

svgTo1BitPng(inputfile, outputfile);