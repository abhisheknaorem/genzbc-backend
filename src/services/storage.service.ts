import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

function getS3Client(): S3Client {
  const provider = process.env.STORAGE_PROVIDER || 's3';
  if (provider === 'r2') {
    return new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function getBucket(): string {
  return process.env.STORAGE_PROVIDER === 'r2'
    ? process.env.R2_BUCKET!
    : process.env.AWS_S3_BUCKET!;
}

export interface UploadResult {
  fileKey: string;
  fileUrl: string;
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder = 'transactions'
): Promise<UploadResult> {
  const client = getS3Client();
  const bucket = getBucket();
  const ext = path.extname(originalName);
  const fileKey = `${folder}/${crypto.randomUUID()}${ext}`;

  await client.send(new PutObjectCommand({
    Bucket: bucket, Key: fileKey, Body: buffer, ContentType: mimeType,
  }));

  let fileUrl: string;
  if (process.env.STORAGE_PROVIDER === 'r2' && process.env.R2_PUBLIC_URL) {
    fileUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`;
  } else {
    const region = process.env.AWS_REGION || 'us-east-1';
    fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;
  }

  return { fileKey, fileUrl };
}

export async function deleteFile(fileKey: string): Promise<void> {
  const client = getS3Client();
  await client.send(new DeleteObjectCommand({ Bucket: getBucket(), Key: fileKey }));
}

export async function getPresignedUrl(fileKey: string, expiresIn = 3600): Promise<string> {
  const client = getS3Client();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: getBucket(), Key: fileKey }), { expiresIn });
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
