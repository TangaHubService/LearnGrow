import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { Readable } from "stream";
import { google } from "googleapis";
import { env } from "./env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface StorageResult {
  publicUrl: string;
  secureUrl: string;
  storagePath: string;
  originalName?: string;
  mimeType?: string;
  googleDriveFileId?: string;
  downloadLink?: string;
}

export interface StorageProvider {
  uploadFile(file: Express.Multer.File, folder: string): Promise<StorageResult>;
  deleteFile(storagePath: string): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    // Save uploads inside 'public/uploads' under root folder
    this.uploadDir = path.resolve(__dirname, "../../../public/uploads");
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<StorageResult> {
    const fileExt = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
    
    const targetFolder = path.join(this.uploadDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const targetPath = path.join(targetFolder, uniqueName);
    fs.writeFileSync(targetPath, file.buffer);

    // Serves /uploads/<folder>/<filename> via static server
    const relativeUrl = `/uploads/${folder}/${uniqueName}`.replace(/\\/g, "/");
    
    return {
      publicUrl: relativeUrl,
      secureUrl: relativeUrl,
      storagePath: path.join(folder, uniqueName).replace(/\\/g, "/"),
    };
  }

  async deleteFile(storagePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, storagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}

export class CloudinaryStorageProvider implements StorageProvider {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName = env.CLOUDINARY_CLOUD_NAME || "";
    this.apiKey = env.CLOUDINARY_API_KEY || "";
    this.apiSecret = env.CLOUDINARY_API_SECRET || "";
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<StorageResult> {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error("Cloudinary credentials are not fully configured in your .env file.");
    }
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signatureStr = `folder=${folder}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    formData.append("file", blob, file.originalname);
    formData.append("api_key", this.apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`;
    
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cloudinary upload failed: ${errText}`);
    }

    const data = (await response.json()) as any;
    return {
      publicUrl: data.url || data.secure_url,
      secureUrl: data.secure_url,
      storagePath: data.public_id,
    };
  }

  async deleteFile(storagePath: string): Promise<void> {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) return;
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signatureStr = `public_id=${storagePath}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

    const formData = new FormData();
    formData.append("public_id", storagePath);
    formData.append("api_key", this.apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);

    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/destroy`;
    await fetch(url, {
      method: "POST",
      body: formData,
    });
  }
}

export class GoogleDriveStorageProvider implements StorageProvider {
  private drive: any;
  private rootFolderId: string;

  constructor() {
    const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
    let privateKey = env.GOOGLE_PRIVATE_KEY || "";
    this.rootFolderId = env.GOOGLE_DRIVE_FOLDER_ID || "";

    if (!email || !privateKey || !this.rootFolderId) {
      console.warn("WARNING: Google Drive storage provider credentials are not fully configured in your .env file.");
      return;
    }

    // Replace escaped newlines if any
    privateKey = privateKey.replace(/\\n/g, "\n");

    try {
      const auth = new google.auth.JWT({
        email: email,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/drive"]
      });
      this.drive = google.drive({ version: "v3", auth });
    } catch (err) {
      console.error("Failed to initialize Google Drive client:", err);
    }
  }

  private async getOrCreateFolder(parentFolderId: string, folderName: string): Promise<string> {
    if (!this.drive) throw new Error("Google Drive client not initialized.");

    const safeFolderName = folderName.replace(/'/g, "\\'");
    const q = `name = '${safeFolderName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed = false`;
    
    const response = await this.drive.files.list({
      q,
      spaces: "drive",
      fields: "files(id, name)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = response.data.files;
    if (files && files.length > 0) {
      return files[0].id;
    }

    const folderMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    };

    const folder = await this.drive.files.create({
      requestBody: folderMetadata,
      fields: "id",
      supportsAllDrives: true,
    });

    return folder.data.id;
  }

  async uploadFile(file: Express.Multer.File, folderPath: string): Promise<StorageResult> {
    if (!this.drive) {
      throw new Error("Google Drive storage provider is not initialized. Check your credentials.");
    }

    const folderNames = folderPath.split("/").map(f => f.trim()).filter(Boolean);
    let currentParentId = this.rootFolderId;

    for (const folderName of folderNames) {
      currentParentId = await this.getOrCreateFolder(currentParentId, folderName);
    }

    const media = {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer),
    };

    const fileMetadata = {
      name: file.originalname,
      parents: [currentParentId],
    };

    const driveFile = await this.drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name, mimeType, size, webViewLink, webContentLink",
      supportsAllDrives: true,
    });

    const fileId = driveFile.data.id;
    if (!fileId) {
      throw new Error("Failed to upload file to Google Drive: no file ID returned");
    }

    await this.drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
      supportsAllDrives: true,
    });

    const finalFile = await this.drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, webViewLink, webContentLink",
      supportsAllDrives: true,
    });

    const publicUrl = finalFile.data.webViewLink || "";
    const downloadLink = finalFile.data.webContentLink || "";

    return {
      publicUrl,
      secureUrl: publicUrl,
      storagePath: fileId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      googleDriveFileId: fileId,
      downloadLink,
    };
  }

  async deleteFile(storagePath: string): Promise<void> {
    if (!this.drive) return;
    try {
      await this.drive.files.delete({
        fileId: storagePath,
      });
    } catch (err) {
      console.error(`Failed to delete file with ID ${storagePath} from Google Drive:`, err);
    }
  }
}

export function getStorageProvider(): StorageProvider {
  const provider = env.STORAGE_PROVIDER || "LOCAL";
  const upper = provider.toUpperCase();
  if (upper === "CLOUDINARY") {
    return new CloudinaryStorageProvider();
  }
  if (upper === "GOOGLE_DRIVE") {
    return new GoogleDriveStorageProvider();
  }
  return new LocalStorageProvider();
}

export const storageService = getStorageProvider();
