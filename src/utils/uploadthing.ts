import { createUploadthing, type FileRouter } from "uploadthing/next";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "../app/api/uploadthing/core";

const f = createUploadthing();

export const ourFileRouter = {
  videoUploader: f({ video: { maxFileSize: "2GB" } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>(); 