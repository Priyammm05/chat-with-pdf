import fs from "fs/promises";
import fetch from "node-fetch";
import path from "path";

export async function downloadFromIPFS(fileCid: string) {
    try {
        const url = `https://nftstorage.link/ipfs/${fileCid}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Error fetching PDF: ${response.status}`);
        }

        const pdfArrayBuffer = await response.arrayBuffer(); // Get the PDF content as an ArrayBuffer

        // Convert the ArrayBuffer to a Buffer (Node.js Buffer)
        const pdfBuffer = Buffer.from(pdfArrayBuffer);

        // Define the directory path where the PDF will be saved
        const dirPath = path.join(__dirname, "/tmp/"); // Customize the directory path

        // Create the directory if it doesn't exist
        await fs.mkdir(dirPath, { recursive: true });

        // Define the local file path including the directory
        const filePath = path.join(dirPath, `pdf-${Date.now()}.pdf`);
     
        // Write the PDF content to the local file
        await fs.writeFile(filePath, pdfBuffer);


        return filePath;
    } catch (error) {
        console.error("Error downloading PDF from IPFS:", error);
        return null; // Return null in case of an error
    }
}

export function getIPFSUrl(fileCid: string) {
    const url = `https://nftstorage.link/ipfs/${fileCid}`;
    return url;
}
