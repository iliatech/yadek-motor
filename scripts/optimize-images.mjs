import sharp from "sharp";
import { readdir } from "node:fs/promises";
import path from "node:path";

const inputDir = path.resolve("src/assets");

const files = await readdir(inputDir);

const imageFiles = files.filter((file) =>
  /\.(png|jpe?g)$/i.test(file),
);

for (const file of imageFiles) {
  const inputPath = path.join(inputDir, file);
  const outputPath = path.join(
    inputDir,
    `${path.parse(file).name}.webp`,
  );

  await sharp(inputPath)
    .webp({
      quality: 82,
      effort: 5,
    })
    .toFile(outputPath);

  console.log(`✓ ${file} -> ${path.basename(outputPath)}`);
}

console.log("\nتمام تصاویر به WebP تبدیل شدند.");