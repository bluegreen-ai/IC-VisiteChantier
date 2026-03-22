-- Migration: create_betc_tables
-- Applied: 2026-03-21
-- Creates the 6 betc_* tables with RLS, indexes, and updated_at triggers

-- Buildings (shared reference across missions)
CREATE TABLE betc_buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  latitude FLOAT,
  longitude FLOAT,
  building_type TEXT,
  construction_year INT,
  floor_count INT,
  surface_area FLOAT,
  structural_system TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE betc_buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_buildings" ON betc_buildings FOR ALL USING (auth.uid() = user_id);
CREATE INDEX ON betc_buildings(user_id);

-- Missions
CREATE TABLE betc_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  building_id UUID REFERENCES betc_buildings(id),
  name TEXT NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'active',
  brief TEXT,
  checklist JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  visited_at DATE
);
ALTER TABLE betc_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_missions" ON betc_missions FOR ALL USING (auth.uid() = user_id);
CREATE INDEX ON betc_missions(user_id, status);
CREATE INDEX ON betc_missions(building_id);

-- Messages (chat history)
CREATE TABLE betc_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES betc_missions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  attachments JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE betc_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_messages" ON betc_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM betc_missions WHERE id = betc_messages.mission_id AND user_id = auth.uid())
);
CREATE INDEX ON betc_messages(mission_id, created_at);

-- Observations (core entity — feeds reports)
CREATE TABLE betc_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES betc_missions(id) ON DELETE CASCADE,
  ref TEXT,
  element TEXT,
  description TEXT NOT NULL,
  cause TEXT,
  action TEXT,
  metadata JSONB,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE betc_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_observations" ON betc_observations FOR ALL USING (
  EXISTS (SELECT 1 FROM betc_missions WHERE id = betc_observations.mission_id AND user_id = auth.uid())
);
CREATE INDEX ON betc_observations(mission_id, sort_order);

-- Photos
CREATE TABLE betc_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES betc_missions(id) ON DELETE CASCADE,
  observation_id UUID REFERENCES betc_observations(id),
  message_id UUID REFERENCES betc_messages(id),
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  size_bytes INT,
  width INT,
  height INT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE betc_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_photos" ON betc_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM betc_missions WHERE id = betc_photos.mission_id AND user_id = auth.uid())
);
CREATE INDEX ON betc_photos(mission_id);

-- Reports
CREATE TABLE betc_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES betc_missions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_type TEXT,
  status TEXT DEFAULT 'brouillon',
  sections JSONB,
  template_id TEXT,
  storage_path TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE betc_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_reports" ON betc_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM betc_missions WHERE id = betc_reports.mission_id AND user_id = auth.uid())
);
CREATE INDEX ON betc_reports(mission_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION betc_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER betc_buildings_updated_at BEFORE UPDATE ON betc_buildings FOR EACH ROW EXECUTE FUNCTION betc_update_updated_at();
CREATE TRIGGER betc_missions_updated_at BEFORE UPDATE ON betc_missions FOR EACH ROW EXECUTE FUNCTION betc_update_updated_at();
CREATE TRIGGER betc_observations_updated_at BEFORE UPDATE ON betc_observations FOR EACH ROW EXECUTE FUNCTION betc_update_updated_at();
CREATE TRIGGER betc_reports_updated_at BEFORE UPDATE ON betc_reports FOR EACH ROW EXECUTE FUNCTION betc_update_updated_at();
