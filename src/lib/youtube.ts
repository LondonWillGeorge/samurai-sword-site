// Accepts a bare 11-character video ID or any common YouTube URL form
// (watch?v=, youtu.be/, /shorts/, /embed/, /live/). Returns null if none found.
export const parseYouTubeId = (input: string): string | null => {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  const match = value.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match ? match[1] : null;
};

export interface YouTubeUploadResult {
  youtube_id: string;
  thumbnail_url: string | null;
}

// Sends the file to the upload-to-youtube edge function, which uploads it to the
// club channel as unlisted. Rejects with a user-facing message on failure.
export const uploadToYouTube = (
  file: File,
  title: string,
  accessToken: string,
  onProgress: (percent: number) => void,
): Promise<YouTubeUploadResult> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-to-youtube`);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('X-Video-Title', title);
    xhr.setRequestHeader('X-Video-Mime-Type', file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      let json: { youtube_id?: string; thumbnail_url?: string; error?: string };
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error('Unexpected server response.'));
        return;
      }
      if (xhr.status !== 200) {
        reject(new Error(json.error ?? xhr.statusText));
        return;
      }
      if (!json.youtube_id) {
        reject(new Error('No video ID returned.'));
        return;
      }
      resolve({ youtube_id: json.youtube_id, thumbnail_url: json.thumbnail_url ?? null });
    };

    xhr.onerror = () => reject(new Error('Network error during upload.'));

    xhr.send(file);
  });
