// Matches the raw Prisma Folder shape returned by GET /folders on
// the backend (folders.service.ts findAll()) - no BigInt fields here,
// so no string-serialization quirks like ZDriveFile.size.
export interface ZDriveFolder {
  id: string;
  name: string;
  userId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}
