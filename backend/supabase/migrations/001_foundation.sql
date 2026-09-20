-- AlgoMentor AI — Foundation Schema
-- Phase 1: Core tables for curriculum, user profiles, and knowledge state
-- Based on DATABASE_SPEC.md
--
-- Run this migration in Supabase SQL Editor or via CLI.

-- ============================================================
-- 1. Profiles (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  preferred_language TEXT DEFAULT 'python',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. Courses
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. Modules
-- ============================================================
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. Topics
-- ============================================================
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. Concepts
-- ============================================================
CREATE TABLE IF NOT EXISTS concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  learning_objectives JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. Concept Relationships (prerequisite graph)
-- ============================================================
CREATE TABLE IF NOT EXISTS concept_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  target_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (
    relationship_type IN ('prerequisite', 'related', 'applied_by', 'pattern', 'contrast')
  ),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_concept_id, target_concept_id, relationship_type)
);

-- ============================================================
-- 7. Student Knowledge (per-concept mastery state)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  mastery_state TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (
    mastery_state IN ('UNKNOWN', 'INTRODUCED', 'LEARNING', 'DEVELOPING', 'PROFICIENT', 'MASTERED')
  ),
  confidence REAL,
  evidence_score REAL DEFAULT 0,
  last_assessed TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, concept_id)
);

-- ============================================================
-- 8. Learning Sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL DEFAULT 'tutoring' CHECK (
    session_type IN ('tutoring', 'practice', 'revision', 'assessment')
  ),
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'completed', 'abandoned')
  ),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- 9. Interactions (within a learning session)
-- ============================================================
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  question JSONB NOT NULL,
  expected_evidence JSONB,
  student_response JSONB,
  evaluation JSONB,
  hint_level INTEGER DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_topics_module ON topics(module_id);
CREATE INDEX IF NOT EXISTS idx_concepts_topic ON concepts(topic_id);
CREATE INDEX IF NOT EXISTS idx_concept_rels_target ON concept_relationships(target_concept_id);
CREATE INDEX IF NOT EXISTS idx_concept_rels_source ON concept_relationships(source_concept_id);
CREATE INDEX IF NOT EXISTS idx_student_knowledge_user ON student_knowledge(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_session ON interactions(session_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Profiles: users can read/update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Curriculum tables: readable by everyone (public curriculum)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses are publicly readable" ON courses FOR SELECT USING (true);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Modules are publicly readable" ON modules FOR SELECT USING (true);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics are publicly readable" ON topics FOR SELECT USING (true);

ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Concepts are publicly readable" ON concepts FOR SELECT USING (true);

ALTER TABLE concept_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Concept relationships are publicly readable" ON concept_relationships FOR SELECT USING (true);

-- Student knowledge: users can only see their own
ALTER TABLE student_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own knowledge" ON student_knowledge FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can modify own knowledge" ON student_knowledge FOR ALL USING (auth.uid() = user_id);

-- Learning sessions: users can only see their own
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON learning_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sessions" ON learning_sessions FOR ALL USING (auth.uid() = user_id);

-- Interactions: access through session ownership
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own interactions" ON interactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM learning_sessions WHERE learning_sessions.id = interactions.session_id AND learning_sessions.user_id = auth.uid()
  ));
CREATE POLICY "Users can manage own interactions" ON interactions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM learning_sessions WHERE learning_sessions.id = interactions.session_id AND learning_sessions.user_id = auth.uid()
  ));
