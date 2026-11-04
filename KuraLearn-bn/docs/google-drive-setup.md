# KuraLearn - Google Drive Service Account Upload Integration Setup Guide

This guide details the step-by-step process of setting up a Google Cloud Service Account to enable secure, backend-controlled uploads of learning resources to Google Drive.

---

## Part 1: Create a Google Cloud Project & Enable APIs

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on the project dropdown in the top-left menu, and select **New Project**.
3. Name your project (e.g. `KuraLearn-Drive-Upload`) and click **Create**.
4. Once created, make sure your new project is selected in the project dropdown.
5. In the left-hand navigation sidebar, go to **APIs & Services > Library**.
6. In the search box, search for **Google Drive API**.
7. Click on the **Google Drive API** result and click **Enable**.

---

## Part 2: Create a Service Account & JSON Key

1. Navigate to **IAM & Admin > Service Accounts** in the left sidebar menu.
2. Click **Create Service Account** at the top of the page.
3. Provide a service account name (e.g. `kuralearn-storage-uploader`) and description.
4. Click **Create and Continue**.
5. Under **Grant this service account access to project (optional)**, click **Continue** (no project-level permissions are required since sharing is done folder-by-folder).
6. Click **Done**.
7. In the Service Accounts list, click on the **Email address** of the service account you just created.
8. Switch to the **Keys** tab at the top of the page.
9. Click **Add Key > Create New Key**.
10. Select **JSON** as the key type and click **Create**.
11. A `.json` credentials file will automatically download to your computer. Keep this file extremely secure, as it contains your private keys.

---

## Part 3: Configure Shared Folder & Service Account Access

1. Open [Google Drive](https://drive.google.com/) using your personal or organization account.
2. Create a new folder (e.g. `KuraLearn Uploads`). This will act as the root storage folder.
3. Open the folder and copy its **Folder ID** from the browser address bar:
   - Example URL: `https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`
   - The Folder ID is the last alphanumeric string segment: `1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`.
4. Return to your folder, right-click on the folder name, and select **Share > Share**.
5. Open the downloaded JSON credentials file, locate the `"client_email"` property, and copy the service account email address (e.g. `kuralearn-storage-uploader@your-project-id.iam.gserviceaccount.com`).
6. Paste this service account email in the Google Drive share input box.
7. Assign the **Editor** role to the service account and click **Share**.
   - *Note:* This grants the backend service account full authority to recursively create folders (`School Name / Class / Subject / Resource Type`) and write uploaded files within this specific shared root folder.

---

## Part 4: Update Backend Environment Variables (`.env`)

Open the downloaded JSON credentials file, and copy the values to your `KuraLearn-bn/.env` file:

1. Copy `"client_email"` and assign it to:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account-email@your-project-id.iam.gserviceaccount.com"
   ```
2. Copy `"private_key"` (ensure all newlines `\n` are preserved in the string) and assign it to:
   ```env
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ...\n-----END PRIVATE KEY-----\n"
   ```
3. Set your target folder ID from Part 3 to:
   ```env
   GOOGLE_DRIVE_FOLDER_ID="1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456"
   ```
4. Change the active storage provider to enable Google Drive:
   ```env
   STORAGE_PROVIDER=GOOGLE_DRIVE
   ```

Restart your backend server to load the new environment configuration. You are now ready to perform fully secure, Google-powered school resources uploads!
