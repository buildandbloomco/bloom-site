import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

// Uploads go straight from your browser to Vercel Blob storage. Only you (signed in to admin) can upload.
export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Uploads aren't set up yet. In Vercel, open Storage, create a Blob store, and connect it to this project (see the README)." }, { status: 400 });
  }
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await isAdmin())) throw new Error("Please sign in to admin again.");
        return {
          allowedContentTypes: [
            "video/mp4", "video/quicktime", "video/webm",
            "audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/x-wav", "audio/aac",
            "image/png", "image/jpeg", "image/webp", "application/pdf",
          ],
          maximumSizeInBytes: 1024 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        /* The editor saves the link itself */
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// Lets the editor check whether uploads are set up before sending a file
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ ready: false, error: "Please sign in again." }, { status: 401 });
  return NextResponse.json({ ready: !!process.env.BLOB_READ_WRITE_TOKEN });
}
