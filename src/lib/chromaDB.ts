import { ChromaClient, TransformersEmbeddingFunction } from "chromadb";
import { downloadFromIPFS } from "./ipfs-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { getEmbeddings } from "./embeddings";
import md5 from "md5";
import { v4 as uuidv4 } from "uuid";

export const getChromaClient = async () => {
    const chroma = new ChromaClient({
        path: "http://localhost:8000",
    });

    return chroma;
};

type PDFPage = {
    pageContent: string;
    metadata: {
        loc: { pageNumber: number };
    };
};

export async function loadIPFSIntoChroma(fileCid: string) {
    console.log("downloading pdf");
    const file_name = await downloadFromIPFS(fileCid);

    if (!file_name) {
        throw new Error("could not download from s3");
    }
    const loader = new PDFLoader(file_name);

    const pages = (await loader.load()) as PDFPage[];

    const documents = await Promise.all(pages.map((p) => prepareDocument(p)));
    const flattenedDocuments = documents.flatMap((d) => d);
    const vectors = await Promise.all(documents.flat().map(embedDocument));

    console.log("vectors length: ", vectors.length);

    const client = await getChromaClient();

    const embedder = new TransformersEmbeddingFunction({
        model: "Xenova/all-MiniLM-L6-v2",
    });

    const chromaCollection = await client.getOrCreateCollection({
        name: "chat-with-pdf",
        embeddingFunction: embedder,
    });

    console.log("inserting vectors into chroma");
    // ids,
    //     embeddings,
    //     metadatas,
    //     documents,
    const ids = Array.from({ length: documents.length }, () => uuidv4());
    await chromaCollection.upsert({
        ids,
        documents: flattenedDocuments.map((v) => v.pageContent),
    });

    return documents[0];
}

async function embedDocument(doc: Document) {
    try {
        const embeddings = await getEmbeddings(doc.pageContent);

        const hash = md5(doc.pageContent);

        const result = {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber,
            },
        };

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

    const splitter = new RecursiveCharacterTextSplitter({
        separators: [" "],
        chunkSize: 1000,
        chunkOverlap: 50,
    });

    return await splitter.createDocuments(
        [pageContent],
        [
            {
                pageNumber: metadata.loc.pageNumber,
                text: truncateStringByBytes(pageContent, 36000),
            },
        ]
    );
}
