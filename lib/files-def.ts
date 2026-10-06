/** A document shared between you and a client */
export interface SharedFile { id: string; name: string; url: string; size: number; by: "us" | "client"; at: string; note: string }
/** Largest file a client can upload */
export const CLIENT_MAX = 50 * 1024 * 1024;
export const FILE_TYPES = [
  "application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain", "text/csv",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
export const FILE_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
/** Only links from your own file storage are accepted */
export const isBlobUrl = (u: string) => /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(u);
export const fileSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

