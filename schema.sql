-- ============================================
-- TechOL — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Users profile table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'New User',
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  photo_url TEXT,
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  website TEXT DEFAULT '',
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  is_company BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  hashtags TEXT[] DEFAULT '{}',
  image_url TEXT,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  participant_2 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message TEXT DEFAULT '',
  last_timestamp TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (participant_1, participant_2)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL,
  time TEXT DEFAULT '',
  location TEXT DEFAULT '',
  attendees_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event attendees
CREATE TABLE IF NOT EXISTS event_attendees (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, event_id)
);

-- Hashtags trending
CREATE TABLE IF NOT EXISTS hashtags (
  tag TEXT PRIMARY KEY,
  count INT DEFAULT 1,
  last_used TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_uid UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  from_uid UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  type TEXT DEFAULT 'general',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_messages_convo ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_uid);
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies: everyone can read, authenticated users can write
CREATE POLICY "Public read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users delete own" ON profiles FOR DELETE USING (auth.uid() = id);

CREATE POLICY "Public read" ON posts FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Own delete" ON posts FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Own update" ON posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Public read" ON likes FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own delete" ON likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public read" ON bookmarks FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own delete" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public read" ON comments FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Own delete" ON comments FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Public read" ON follows FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Own delete" ON follows FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "Participants read" ON conversations FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "Auth insert" ON conversations FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "Participants update" ON conversations FOR UPDATE USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Convo members read" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid()))
);
CREATE POLICY "Auth insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Public read" ON events FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Own update" ON events FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Public read" ON event_attendees FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON event_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read" ON hashtags FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON hashtags FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update" ON hashtags FOR UPDATE USING (true);

CREATE POLICY "Own read" ON notifications FOR SELECT USING (auth.uid() = target_uid);
CREATE POLICY "Auth insert" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Own update" ON notifications FOR UPDATE USING (auth.uid() = target_uid);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username, email, photo_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(
      LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'user'), '[^a-zA-Z0-9]', '', 'g')) || FLOOR(RANDOM() * 1000)::TEXT,
      'user' || FLOOR(RANDOM() * 99999)::TEXT
    ),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
