
-- Create RPC function to create player profile
CREATE OR REPLACE FUNCTION public.create_player_profile(
  p_clerk_user_id TEXT,
  p_username TEXT,
  p_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_player_id UUID;
BEGIN
  INSERT INTO public.players (
    clerk_user_id,
    username,
    email,
    in_game_name,
    free_fire_uid
  ) VALUES (
    p_clerk_user_id,
    p_username,
    p_email,
    NULL,
    NULL
  )
  RETURNING id INTO new_player_id;
  
  RETURN new_player_id;
END;
$$;

-- Create RPC function to update player profile
CREATE OR REPLACE FUNCTION public.update_player_profile(
  p_clerk_user_id TEXT,
  p_in_game_name TEXT,
  p_free_fire_uid TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.players 
  SET 
    in_game_name = p_in_game_name,
    free_fire_uid = p_free_fire_uid,
    updated_at = NOW()
  WHERE clerk_user_id = p_clerk_user_id;
  
  RETURN FOUND;
END;
$$;
