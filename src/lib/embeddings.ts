// import { OpenAIApi, Configuration } from "openai-edge";

// const config = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(config);

// export async function getEmbeddings(text: string) {
//     try {
//         const response = await openai.createEmbedding({
// model: "text-embedding-ada-002",
// input: text.replace(/\n/g, " "),
//         });
//         const result = await response.json();
//         console.log("OPEN AI RESULT", result);
//         return result.data[0].embedding as number[];
//     } catch (error) {
//         console.log("error calling openai embeddings api", error);
//         throw error;
//     }
// }

// HUGGING FACE

import { pipeline } from "@xenova/transformers";

export async function getEmbeddings(text: string) {
    try {
        const embeddings = await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2"
        );

        const response = await embeddings(text.replace(/\n/g, " "), {
            pooling: "mean",
            normalize: true,
        });

        const result = await response.data;
        return result as number[];

        // console.log(" HUGGING FACE RESPONSE ", response.json());
        // const result = await response.json();
        // console.log("OPEN AI RESULT", result);
        //
    } catch (error) {
        console.log("error calling embeddings api", error);
        throw error;
    }
}
