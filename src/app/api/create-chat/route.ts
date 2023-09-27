import { loadIPFSIntoPinecone } from "@/lib/pinecone";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getIPFSUrl } from "@/lib/ipfs-server";
import { loadIPFSIntoChroma } from "@/lib/chromaDB";

export async function POST(req: Request, res: Response) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { fileCid, file_name } = body;

        console.log(fileCid, file_name);
        await loadIPFSIntoChroma(fileCid);
        const chat_id = await db
            .insert(chats)
            .values({
                fileKey: fileCid,
                pdfName: file_name,
                pdfUrl: getIPFSUrl(fileCid),
                userId,
            })
            .returning({
                insertedId: chats.id,
            });

        return NextResponse.json(
            {
                chat_id: chat_id[0].insertedId,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
