
## Project info

**URL**: https://lovable.dev/projects/17849ad1-fdcc-465b-a06f-e31173f58f90

But now I switched development to using Claude Code, more powerful than Lovable, quick to implement new features.


## Here is Claude Code's plan for the user video upload functionality inside the Members (logged in) area.
I asked it to adjust so the upload is handled by client (user's computer) instead of by the server.

Plan: Member Videos Upload Page
                                                                                      
 Context                                                

 Members want to upload videos to the club's YouTube channel and have them appear
 embedded in a members-only page. YouTube's Data API v3 requires OAuth 2.0 for
 uploading. To avoid Edge Function memory/timeout limits, the Edge Function only
 handles OAuth and initiates a YouTube resumable upload — returning a signed upload
 URI to the client. The browser then uploads the file directly to YouTube (bypassing
 the Edge Function), enabling real-time progress tracking via XHR. Video metadata is
 stored in Supabase by the client after upload completes. Videos are unlisted on
 YouTube; the speed slider is enabled.

 Architecture: Resumable Upload Flow

 Client                     Edge Function              YouTube API
 Supabase DB
   |                              |                         |                      |
   |-- POST /upload-to-youtube -->|                         |                      |
   |   { title, fileSize, mime }  |                         |                      |
   |                              |-- validate JWT          |                      |
   |                              |-- check size ≤ 100MB    |                      |
   |                              |-- refresh token if exp  |                      |
   |                              |-- POST resumable init ->|                      |
   |                              |<- Location header ----  |                      |
   |<-- { upload_url } -----------|                         |                      |
   |                              |                         |                      |
   |-- PUT upload_url (XHR) ------------------------------>|                      |
   |   (tracks progress client-side)                        |                      |
   |<-- { id: youtube_id } -------------------------------- |                      |
   |                                                        |                      |
   |-- supabase.from('member_videos').insert(...) ----------------------->|        |

 ---
 Files to Create / Modify

 ┌────────┬────────────────────────────────────────────────────────────┐
 │ Action │                            File                            │
 ├────────┼────────────────────────────────────────────────────────────┤
 │ Create │ /supabase/migrations/20260322000001_add_member_videos.sql  │
 ├────────┼────────────────────────────────────────────────────────────┤
 │ Create │ /supabase/migrations/20260322000002_add_youtube_tokens.sql │
 ├────────┼────────────────────────────────────────────────────────────┤
 │ Create │ /supabase/functions/upload-to-youtube/index.ts             │
 ├────────┼────────────────────────────────────────────────────────────┤
 │ Create │ /src/pages/MemberVideos.tsx                                │
 ├────────┼────────────────────────────────────────────────────────────┤
 │ Modify │ /supabase/config.toml                                      │
 ├────────┼────────────────────────────────────────────────────────────┤
 │ Modify │ /src/App.tsx                                               │
 ├────────┼────────────────────────────────────────────────────────────┤
 │ Modify │ /src/components/Navigation.tsx                             │
 └────────┴────────────────────────────────────────────────────────────┘

 Reuse

 - YouTubeVideo component (/src/components/YouTubeVideo.tsx) — embed by YouTube ID,
 speed slider
 - useAuth() from /src/contexts/AuthContext.tsx
 - supabase client from /src/integrations/supabase/client.ts
 - useToast() from /src/hooks/use-toast.ts
 - shadcn/ui: Button, Input, Label, Progress (already installed)

 ---
 Step 1 — Migration: member_videos table

 File: /supabase/migrations/20260322000001_add_member_videos.sql

 CREATE TABLE public.member_videos (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   youtube_id TEXT NOT NULL,
   title TEXT NOT NULL,
   uploader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
 );

 ALTER TABLE public.member_videos ENABLE ROW LEVEL SECURITY;

 CREATE POLICY "Authenticated can view member videos"
   ON public.member_videos FOR SELECT
   TO authenticated USING (true);

 CREATE POLICY "Authenticated can insert own member videos"
   ON public.member_videos FOR INSERT
   TO authenticated WITH CHECK (auth.uid() = uploader_id);

 ---
 Step 2 — Migration: youtube_tokens table

 File: /supabase/migrations/20260322000002_add_youtube_tokens.sql

 Single-row table for the live access token — updated on each refresh.

 CREATE TABLE public.youtube_tokens (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
   access_token TEXT NOT NULL,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
 );

 ALTER TABLE public.youtube_tokens ENABLE ROW LEVEL SECURITY;
 -- No RLS policies — only accessible via service role key in Edge Function

 Seed initial access token after migration:
 INSERT INTO public.youtube_tokens (access_token) VALUES ('<initial-access-token>');

 ---
 Step 3 — Edge Function: upload-to-youtube/index.ts

 File: /supabase/functions/upload-to-youtube/index.ts

 The Edge Function handles only OAuth and initiation — no video bytes pass through
 it.

 Receives (JSON body):

 { title: string, fileSize: number, mimeType: string }

 Logic:

 1. CORS preflight pass-through
 2. Validate JWT → get callingUser
 3. Parse JSON body; validate title present, fileSize ≤ 104,857,600 (100 MB)
 4. Read access_token from youtube_tokens table via service role client
 5. Call YouTube resumable upload initiation:
 POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=s
 nippet,status
 Authorization: Bearer <access_token>
 Content-Type: application/json
 X-Upload-Content-Type: <mimeType>
 X-Upload-Content-Length: <fileSize>
 Body: { snippet: { title, categoryId: "17" }, status: { privacyStatus: "unlisted" }
 }
 6. If 401 → refreshAccessToken():
   - POST https://oauth2.googleapis.com/token with YOUTUBE_REFRESH_TOKEN,
 YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET
   - UPDATE youtube_tokens with new token + updated_at
   - Retry initiation once
 7. Extract Location header from YouTube response → the resumable upload URI
 8. Return { upload_url: <uri> }

 Env vars (Supabase secrets):

 ┌───────────────────────────┬────────────────────────────────┐
 │            Var            │            Purpose             │
 ├───────────────────────────┼────────────────────────────────┤
 │ YOUTUBE_REFRESH_TOKEN     │ Long-lived OAuth refresh token │
 ├───────────────────────────┼────────────────────────────────┤
 │ YOUTUBE_CLIENT_ID         │ OAuth 2.0 client ID            │
 ├───────────────────────────┼────────────────────────────────┤
 │ YOUTUBE_CLIENT_SECRET     │ OAuth 2.0 client secret        │
 ├───────────────────────────┼────────────────────────────────┤
 │ SUPABASE_URL              │ Auto-injected                  │
 ├───────────────────────────┼────────────────────────────────┤
 │ SUPABASE_SERVICE_ROLE_KEY │ Auto-injected                  │
 └───────────────────────────┴────────────────────────────────┘

 ---
 Step 4 — config.toml addition

 [functions.upload-to-youtube]
 verify_jwt = false

 ---
 Step 5 — New page: MemberVideos.tsx

 File: /src/pages/MemberVideos.tsx

 Auth pattern (mirrors Messages.tsx):

 const { user, signOut, loading } = useAuth();
 useEffect(() => {
   if (!loading && !user) navigate('/login');
 }, [user, loading, navigate]);
 if (loading) return <LoadingScreen />;
 if (!user) return null;

 State:

 const [videos, setVideos] = useState<MemberVideo[]>([]);
 const [title, setTitle] = useState('');
 const [videoFile, setVideoFile] = useState<File | null>(null);
 const [uploadProgress, setUploadProgress] = useState<number | null>(null); // null =
  not uploading
 const fileInputRef = useRef<HTMLInputElement>(null);
 uploadProgress drives all in-progress UI: null = idle, 0–100 = uploading.

 Client-side file validation (onChange):

 - Reject non-video/* → destructive toast
 - Reject > 100 MB → destructive toast
 - Otherwise set videoFile

 Upload handler (handleUpload):

 1. setUploadProgress(0) → locks the form
 2. Get fresh JWT: const { data: { session } } = await supabase.auth.getSession()
 3. Call Edge Function:
 fetch(`${VITE_SUPABASE_URL}/functions/v1/upload-to-youtube`, {
   method: 'POST',
   headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type':
 'application/json' },
   body: JSON.stringify({ title: title.trim(), fileSize: videoFile.size, mimeType:
 videoFile.type })
 })
 4. On error from Edge Function → destructive toast, setUploadProgress(null), return
 5. XHR upload to upload_url:
 const xhr = new XMLHttpRequest();
 xhr.open('PUT', upload_url);
 xhr.setRequestHeader('Content-Type', videoFile.type);
 xhr.upload.onprogress = (e) => {
   if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
 };
 xhr.onload = async () => {
   if (xhr.status === 200 || xhr.status === 201) {
     const ytData = JSON.parse(xhr.responseText);
     await supabase.from('member_videos').insert({
       youtube_id: ytData.id, title: title.trim(), uploader_id: user.id
     });
     toast({ title: 'Video uploaded!', description: `"${title.trim()}" is now live.`
 });
     setTitle(''); setVideoFile(null); fileInputRef.current.value = '';
     fetchVideos();
   } else {
     toast({ title: 'Upload failed', description: xhr.responseText, variant:
 'destructive' });
   }
   setUploadProgress(null);
 };
 xhr.onerror = () => {
   toast({ title: 'Network error during upload', variant: 'destructive' });
   setUploadProgress(null);
 };
 xhr.send(videoFile);

 Upload in-progress UI (shown when uploadProgress !== null):

 - Warning banner (prominent, above the form):
 ⚠ Upload in progress — please do not close or navigate away from this tab.
   You can open a new tab to continue browsing.
 - Progress bar (shadcn <Progress value={uploadProgress} />) + {uploadProgress}%
 label
 - All form inputs disabled
 - Upload button disabled, label shows "Uploading..."

 Video grid:

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
   {videos.map(video => (
     <YouTubeVideo
       key={video.id}
       videoId={video.youtube_id}
       caption={video.title}
       aspectRatio="landscape"
       lazyLoad
       showSpeedSlider={true}
     />
   ))}
 </div>

 fetchVideos:

 supabase.from('member_videos').select('*').order('created_at', { ascending: false })
 Called on mount (when user set) and after successful upload.

 ---
 Step 6 — App.tsx changes

 Add import after line 25 (ChangePassword):
 import MemberVideos from "./pages/MemberVideos";

 Add route before line 57 (the catch-all comment):
 <Route path="/member-videos" element={<MemberVideos />} />

 ---
 Step 7 — Navigation.tsx changes

 Desktop dropdown — add after Messages <Link> (line 289):

 <Link
   to="/member-videos"
   className="block px-4 py-2 text-sm tracking-wider text-muted-foreground
 hover:text-primary hover:bg-secondary transition-colors"
 >
   Member Videos
 </Link>

 Mobile accordion — add after Messages <Link> (line 365):

 <Link
   to="/member-videos"
   onClick={() => { setIsOpen(false); setOpenSubmenu(null); }}
   className="block py-2 text-sm tracking-wider text-muted-foreground
 hover:text-primary transition-colors"
 >
   Member Videos
 </Link>

 ---
 Pre-flight Setup (one-time, before deploying)

 1. Google Cloud Console: OAuth 2.0 credentials (Web application type). Complete
 consent flow once via OAuth Playground to get access_token + refresh_token for the
 club YouTube account.
 2. Set Supabase secrets (Edge Functions read these, not .env):
 supabase secrets set YOUTUBE_REFRESH_TOKEN=... YOUTUBE_CLIENT_ID=...
 YOUTUBE_CLIENT_SECRET=...
 3. Seed access token in Supabase SQL editor:
 INSERT INTO public.youtube_tokens (access_token) VALUES ('<initial-access-token>');
 4. Apply migrations: supabase db push
 5. Deploy function: supabase functions deploy upload-to-youtube

 ▎ Note: .env credentials are Vite frontend only — Edge Functions require Supabase
 secrets.

 ---
 Verification

 1. Log in → Members dropdown shows "Member Videos"
 2. /member-videos loads; empty state message shown
 3. Select file > 100 MB → destructive toast, no upload attempted
 4. Select valid video + enter title → click Upload
 5. Warning banner appears, progress bar increments, form is disabled
 6. On completion: toast confirms, video appears in grid with speed slider
 7. YouTube Studio: video exists as Unlisted
 8. Log out → /member-videos redirects to /login



## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/17849ad1-fdcc-465b-a06f-e31173f58f90) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use Claude Code inside VS Code IDE!**

Below are Lovable auto instructions, if someone actually wants to copy this, suggest being ready to use AI to solve installation issues.
As with all software projects, assume you will get **unexpected problems**.

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/17849ad1-fdcc-465b-a06f-e31173f58f90) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
