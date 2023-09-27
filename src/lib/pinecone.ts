import {
    Pinecone,
    Vector,
    utils as PineconeUtils,
    PineconeRecord,
    RecordMetadata,
} from "@pinecone-database/pinecone";
import { downloadFromIPFS } from "./ipfs-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import {
    Document,
    RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embeddings";
import md5 from "md5";
import { convertToAscii } from "./utils";



export const getPineconeClient = async () => {
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
        environment: process.env.PINECONE_ENVIRONMENT!,
    });

    return pinecone;
};

type PDFPage = {
    pageContent: string;
    metadata: {
        loc: { pageNumber: number };
    };
};

export async function loadIPFSIntoPinecone(fileCid: string) {
    console.log("downloading pdf");
    const file_name = await downloadFromIPFS(fileCid);

    if (!file_name) {
        throw new Error("could not download from s3");
    }
    const loader = new PDFLoader(file_name);

    const pages = (await loader.load()) as PDFPage[];

    const documents = await Promise.all(pages.map(prepareDocument));

    const vectors = await Promise.all(documents.flat().map(embedDocument));
    console.log("vectors: ", vectors);

    const client = await getPineconeClient();
    const pineconeIndex = client.Index("chat-with-pdf");

    console.log("inserting vectors into pinecone");

    // await pineconeIndex.upsert(vectors);

    return documents[0];
}

async function embedDocument(doc: Document) {
    try {
        const embeddings = await getEmbeddings(doc.pageContent);
        
        const hash = md5(doc.pageContent);
        console.log("HASH: ", hash);

        const result = {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber,
            },
        };

        console.log("THE RESULT OBJECT:", result);

        return result;
    } catch (error) {
        console.log("error embedding document", error);
        throw error;
    }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
    const enc = new TextEncoder();
    return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFPage) {
    let { pageContent, metadata } = page;
    pageContent = pageContent.replace(/\n/g, "");

    const splitter = new RecursiveCharacterTextSplitter();
    const docs = await splitter.splitDocuments([
        new Document({
            pageContent,
            metadata: {
                pageNumber: metadata.loc.pageNumber,
                text: truncateStringByBytes(pageContent, 36000),
            },
        }),
    ]);

    return docs;
}
