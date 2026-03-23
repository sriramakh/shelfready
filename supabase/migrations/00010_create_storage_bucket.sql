-- ============================================================================
-- Migration: 00010_create_storage_bucket
-- Description: Creates the storage bucket for generated images and sets up
--              storage-level RLS policies for upload and public read access.
-- ============================================================================

-- Create the bucket (public = true allows unauthenticated reads via public URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Storage Policies
-- ============================================================================

-- Authenticated users can upload files into their own folder.
-- Folder structure: generated-images/<user_uuid>/<filename>
CREATE POLICY "storage_images_insert_own"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'generated-images'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- Authenticated users can update (overwrite) their own files.
CREATE POLICY "storage_images_update_own"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'generated-images'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    )
    WITH CHECK (
        bucket_id = 'generated-images'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- Authenticated users can delete their own files.
CREATE POLICY "storage_images_delete_own"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'generated-images'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- Public read access for all generated images (the bucket is public).
CREATE POLICY "storage_images_select_public"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'generated-images');
