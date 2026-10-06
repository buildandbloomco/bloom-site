import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { currentClient } from "@/lib/auth";
import { rateLimit } from "@/lib/data";
import { CLIENT_MAX, FILE_TYPES, listFiles } from "@/lib/files";

// A signed-in client sends a document straight to file storage. Documents and images only, 50 MB each.
export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "File sharing is not turned on yet. Please email your file instead." }, { status: 400 });
  const body = (await request.json()) as HandleUploadBody;
  try {
    const out = await handleUpload({
      body, request,
      onBeforeGenerateToken: async (pathname) => {
        const client = await currentClient();
        if (!client) throw new Error("Your session ended. Please enter your access code again.");
        if (!pathname.startsWith(`clients/${client.id}/`)) throw new Error("That upload is not allowed.");
        if (!(await rateLimit(`up:${client.id}`, 40, 60 * 60))) throw new Error("That is a lot of uploads. Try again in an hour.");
        if ((await listFiles(client.id)).length >= 200) throw new Error("Your shared files are full. Ask us to clear some space.");
        return { allowedContentTypes: FILE_TYPES, maximumSizeInBytes: CLIENT_MAX, addRandomSuffix: true };
      },
      onUploadCompleted: async () => { /* the page saves the file's name and link */ },
    });
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function GET() {
  const client = await currentClient();
  if (!client) return NextResponse.json({ ready: false, error: "Your session ended. Please enter your access code again." }, { status: 401 });
  return NextResponse.json({ ready: !!process.env.BLOB_READ_WRITE_TOKEN });
}
