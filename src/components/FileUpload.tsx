"use client";

import { Inbox, Loader2 } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import { NFTStorage, File, Blob } from "nft.storage";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";

const FileUpload = () => {
    const client = new NFTStorage({
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweENEQ0M0OTNENTkzMTljNkY1MjNERkE2MzNFNWU2NmFCM0ExOGIyZTIiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY5NTgzMTgzNjg0MCwibmFtZSI6ImNoYXQtd2l0aC1wZGYifQ.4cuG9LWcYpW4ypg-RPaHnUVSWNcZAyK_kCwX-hCkRjo",
    });

    const router = useRouter();
    const [uploading, setUploading] = React.useState(false);

    const { mutate, isLoading } = useMutation({
        mutationFn: async ({
            fileCid,
            file_name,
        }: {
            fileCid: string;
            file_name: string;
        }) => {
            const response = await axios.post("/api/create-chat", {
                fileCid,
                file_name,
            });
            return response.data;
        },
    });

    const uploadPdfToIpfs = async (file: File) => {
        return new Promise(async (resolve, reject) => {
            const fr = new FileReader();

            fr.readAsArrayBuffer(file);

            fr.onload = async () => {
                try {
                    const fileBlob = new Blob([fr.result!]);
                    const fileCid = await client.storeBlob(fileBlob);

                    const metadata = {
                        metadata: {
                            file: fileCid,
                        },
                    };

                    const data = new Blob([JSON.stringify(metadata)]);
                    const { car } = await NFTStorage.encodeBlob(data);
                    const cid = await client.storeCar(car);

                    const result = {
                        fileCid,
                        file_name: file.name,
                    };

                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
        });
    };

    const { getRootProps, getInputProps } = useDropzone({
        accept: { "application/pdf": [".pdf"] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file.size > 10 * 1024 * 1024) {
                // bigger than 10mb!
                toast.error("File too large");
                return;
            }
            try {
                setUploading(true);
                const data = (await uploadPdfToIpfs(file)) as {
                    fileCid: string;
                    file_name: string;
                };

                if (!data?.fileCid || !data.file_name) {
                    toast.error("Something went wrong");
                    return;
                }

                mutate(data, {
                    onSuccess: ({ chat_id }) => {
                        toast.success("Chat created!");
                        
                        router.push(`/chat/${chat_id}`);
                    },
                    onError: (err) => {
                        toast.error("Error creating chat");
                        console.log("Error creating chat : " , err);
                    },
                });
            } catch (error) {
                console.error("Error uploading PDF:", error);
                toast.error("Error uploading PDF");
            } finally {
                setUploading(false);
            }
        },
    });

    return (
        <div className="p-2 bg-white rounded-xl">
            <div
                {...getRootProps({
                    className:
                        "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",
                })}
            >
                <input {...getInputProps()} />
                {uploading || isLoading ? (
                    <>
                        {/* loading state */}
                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                        <p className="mt-2 text-sm text-slate-400">
                            Spitting and Embedding data
                        </p>
                    </>
                ) : (
                    <>
                        <Inbox className="w-10 h-10 text-blue-500" />
                        <p className="mt-2 text-sm text-slate-400">
                            Drop PDF Here
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};
export default FileUpload;
