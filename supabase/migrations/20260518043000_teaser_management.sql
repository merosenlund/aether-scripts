-- Add teaser_target_scene_id to serials table
ALTER TABLE public.serials 
ADD COLUMN IF NOT EXISTS teaser_target_scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL;

-- Create function to reset teaser on publish
CREATE OR REPLACE FUNCTION public.handle_scene_publish_reset_teaser()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the scene status is being changed to 'Published'
    IF NEW.status = 'Published' AND (OLD.status IS DISTINCT FROM 'Published' OR OLD.status IS NULL) THEN
        -- Reset the serial's teaser columns if this scene is the current teaser target
        UPDATE public.serials
        SET 
            next_scene_completion_percentage = 0,
            next_scene_update_note = NULL,
            teaser_target_scene_id = NULL
        WHERE id = NEW.serial_id AND teaser_target_scene_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for scenes table
DROP TRIGGER IF EXISTS trigger_reset_serial_teaser_on_publish ON public.scenes;
CREATE TRIGGER trigger_reset_serial_teaser_on_publish
AFTER UPDATE OF status ON public.scenes
FOR EACH ROW
EXECUTE FUNCTION public.handle_scene_publish_reset_teaser();
