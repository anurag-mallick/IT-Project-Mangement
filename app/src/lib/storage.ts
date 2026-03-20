// Note: Supabase Storage is disabled. Please integrate an alternative like Vercel Blob or S3.
export async function uploadAttachment(ticketId: number, file: File) {
  console.warn('Storage is currently disabled (No more Supabase)');
  return {
    path: `placeholder/${file.name}`,
    name: file.name,
    size: file.size,
    type: file.type
  };
}

export async function getFileUrl(path: string) {
  return ''; // Return empty string as storage is disabled
}
