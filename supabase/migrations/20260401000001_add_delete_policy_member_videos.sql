CREATE POLICY "Uploader or admin can delete member videos"
  ON public.member_videos FOR DELETE
  TO authenticated
  USING (
    auth.uid() = uploader_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
