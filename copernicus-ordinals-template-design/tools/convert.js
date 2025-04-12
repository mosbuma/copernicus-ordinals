import fs from 'fs';
import sharp from 'sharp';

async function convertSvgRectsToEmbeddedPng(svgPath, outputSvgPath) {
  const svgContent = fs.readFileSync(svgPath, 'utf-8');

  // Render to PNG (sharp auto-detects size)
  const pngBuffer = await sharp(Buffer.from(svgContent))
    .png()
    .toBuffer();

  // Base64 encode PNG
  const base64Png = pngBuffer.toString('base64');

  // Extract viewBox or size for the outer SVG
  const match = svgContent.match(/viewBox="([^"]+)"/) || svgContent.match(/width="([^"]+)" height="([^"]+)"/);
  let width = "256", height = "256";
  if (match) {
    const parts = match[1].split(' ');
    if (parts.length === 4) {
      width = parts[2];
      height = parts[3];
    } else if (match[0].includes('width')) {
      width = parts[0];
      height = match[2];
    }
  }

  // Create new SVG with embedded image
  const newSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image href="data:image/png;base64,${base64Png}" x="0" y="0" width="${width}" height="${height}" />
</svg>`.trim();

  fs.writeFileSync(outputSvgPath, newSvg);
  console.log(`Embedded SVG saved to: ${outputSvgPath}`);
}

convertSvgRectsToEmbeddedPng('public/templates/face.svg', 'public/templates/face-embedded.svg');
