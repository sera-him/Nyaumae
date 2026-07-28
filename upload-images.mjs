/**
 * 图床上传脚本
 *
 * 将 public/ 下的所有图片上传到指定图床，生成 imageHostMap.ts 的 CDN URL 映射。
 *
 * 使用方式（任选其一）：
 *   node upload-images.mjs lsky     --url https://your-lsky.com --token xxx
 *   node upload-images.mjs aliyun    --accessKey xxx --accessSecret xxx --bucket xxx --region xxx
 *   node upload-images.mjs tencent   --secretId xxx --secretKey xxx --bucket xxx --region xxx
 *   node upload-images.mjs hellohao  --url https://your-hellohao.com --token xxx
 *
 * 输出：打印 imageHostMap.ts 的 map 内容，可直接复制替换。
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, 'public');

// 所有需要上传的图片路径
const IMAGE_FILES = [
  // Story banners
  'story-miia-dream.jpg', 'story-agi-pyramid.jpg', 'story-lila.jpg',
  'story-paradigm.jpg', 'story-code-poem.jpg', 'story-bad-rabbit.jpg',
  'story-sheep-song.jpg', 'story-overdose-icu.jpg', 'story-xishou-nianshou.jpg',
  'story-3-people-world.jpg', 'story-prime-focus.jpg', 'story-fill-ocean.jpg',
  'story-damocles-exam.jpg', 'story-mia-world-1.jpg', 'story-fox-penguin.jpg',
  'story-agi-land.jpg',
  // Sections
  'hero-bg.jpg', 'qet-card.jpg', '4d-test-banner.jpg', 'fsiii-banner.jpg',
  'star-pavilion.jpg',
  // Org
  'org-zhihua.jpg', 'org-impact.jpg', 'org-delan.jpg', 'org-xinjie.jpg',
  'icons/org-zhihua.png', 'icons/org-impact.png', 'icons/org-delan.png', 'icons/org-xinjie.png',
  // Characters
  'characters/miia.jpg', 'characters/miia.jpeg', 'characters/mia.jpg',
  'characters/miya.jpg', 'characters/amiya.jpg', 'characters/miacubic.jpg',
  'characters/lila.jpg', 'characters/mxy.jpg', 'characters/nimfa.jpg',
  'characters/nihilib.jpg', 'characters/miku.jpg', 'characters/qicheng.jpg',
  'characters/haruka.jpg', 'characters/linqian.jpg', 'characters/ifchan.jpg',
  'characters/hamster.jpg', 'characters/linshen.jpg', 'characters/zhaozhao.jpg',
  'characters/mowen.jpg', 'characters/mimi.jpg', 'characters/linear.jpg',
  'characters/dora.jpg', 'characters/cola.jpg', 'characters/mao.jpg',
  'characters/eirene.jpg', 'characters/damocles.jpg', 'characters/alice.jpg',
  'characters/linkmo.jpg', 'characters/quartus.jpg', 'characters/zero.jpg',
];

async function uploadToLsky(filepath, filename, { url, token }) {
  const formData = new FormData();
  const blob = new Blob([readFileSync(filepath)]);
  formData.append('file', blob, filename);
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${url.replace(/\/$/, '')}/api/v1/upload`, {
    method: 'POST', body: formData, headers,
  });
  const data = await res.json();
  if (!data.status) throw new Error(JSON.stringify(data));
  return data.data.links.url;
}

async function uploadToAliyun(filepath, filename, { accessKey, accessSecret, bucket, region }) {
  // Requires @aws-sdk/client-s3
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client({
    region, credentials: { accessKeyId: accessKey, secretAccessKey: accessSecret },
  });
  const key = filename;
  await client.send(new PutObjectCommand({
    Bucket: bucket, Key: key, Body: readFileSync(filepath), ACL: 'public-read',
  }));
  return `https://${bucket}.${region}.aliyuncs.com/${key}`;
}

async function uploadToTencent(filepath, filename, { secretId, secretKey, bucket, region }) {
  // Requires cos-nodejs-sdk-v5
  const COS = (await import('cos-nodejs-sdk-v5')).default;
  const cos = new COS({ SecretId: secretId, SecretKey: secretKey });
  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: bucket, Region: region, Key: filename,
      Body: readFileSync(filepath), ACL: 'public-read',
    }, (err, data) => {
      if (err) return reject(err);
      resolve(`https://${data.Location}`);
    });
  });
}

async function uploadToHellohao(filepath, filename, { url, token }) {
  const formData = new FormData();
  const blob = new Blob([readFileSync(filepath)]);
  formData.append('image', blob, filename);
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${url.replace(/\/$/, '')}/api/upload`, {
    method: 'POST', body: formData, headers,
  });
  const data = await res.json();
  if (!data.code || data.code !== 200) throw new Error(JSON.stringify(data));
  return data.data.url;
}

async function main() {
  const [, , provider] = process.argv;
  if (!['lsky', 'aliyun', 'tencent', 'hellohao'].includes(provider)) {
    console.error('Usage: node upload-images.mjs <lsky|aliyun|tencent|hellohao> [options]');
    process.exit(1);
  }

  const args = {};
  for (let i = 3; i < process.argv.length; i += 2) {
    const key = process.argv[i].replace(/^--/, '');
    args[key] = process.argv[i + 1];
  }

  if (!args.uploadOnly) {
    console.log(`\nUploading ${IMAGE_FILES.length} images via ${provider}...\n`);
  }

  const results = {};
  for (const rel of IMAGE_FILES) {
    const fp = join(PUBLIC, ...rel.split('/'));
    if (!existsSync(fp)) {
      console.warn(`  SKIP (not found): ${rel}`);
      continue;
    }
    const localKey = `/${rel}`;
    try {
      let url;
      switch (provider) {
        case 'lsky': url = await uploadToLsky(fp, rel, args); break;
        case 'aliyun': url = await uploadToAliyun(fp, rel, args); break;
        case 'tencent': url = await uploadToTencent(fp, rel, args); break;
        case 'hellohao': url = await uploadToHellohao(fp, rel, args); break;
      }
      results[localKey] = url;
      if (!args.uploadOnly) console.log(`  OK: ${rel} -> ${url}`);
    } catch (e) {
      console.error(`  FAIL: ${rel} - ${e.message}`);
    }
  }

  if (!args.uploadOnly) {
    console.log('\n=== Copy this into src/lib/imageHostMap.ts ===\n');
    console.log('const CDN = "your-base-url";\n');
    console.log('export const imageHostMap: Record<string, string> = {');
    for (const [key, url] of Object.entries(results)) {
      console.log(`  '${key}': \`\${CDN}/${url.split('/').pop()}\`,`);
    }
    console.log('};');
    console.log('\n==============================================');
  }
}

main().catch(console.error);
