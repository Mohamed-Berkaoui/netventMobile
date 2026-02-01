-- =============================================================================
-- NETVENT DATABASE SEED DATA
-- Real events and sample data matching the actual database schema
-- Uses only existing authenticated users (cannot insert new users due to FK constraint)
-- =============================================================================
-- EXISTING USERS:
-- Organizer: fa157831-4210-452d-805a-2c97e418ea09 (berkaouimedev@gmail.com)
-- Attendee:  c9e9eae7-b057-40f1-943d-3faad0a13941 (berrmedd@gmail.com)
-- =============================================================================

-- =============================================================================
-- EVENTS (Real upcoming events - organized by berkaouimedev)
-- =============================================================================

INSERT INTO events (id, title, description, logo_url, banner_url, venue_name, venue_address, latitude, longitude, radius_meters, start_date, end_date, interests, target_audience, organizer_id, venue_map_url, venue_3d_map_url)
VALUES
  -- LEAP 2025
  (
    'a1111111-1111-1111-1111-111111111111',
    'LEAP 2025',
    'LEAP is the world''s largest tech event, bringing together industry leaders, innovators, and entrepreneurs from around the globe. Experience groundbreaking technology demonstrations, keynote speeches from tech visionaries, and unparalleled networking opportunities. Join 172,000+ attendees for four days of inspiration and innovation in Riyadh.',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    'Riyadh Front Exhibition & Conference Center',
    'King Salman Rd, Riyadh 13311, Saudi Arabia',
    24.7136,
    46.6753,
    500,
    '2025-02-09 09:00:00+03',
    '2025-02-12 18:00:00+03',
    ARRAY['Technology', 'AI & ML', 'Startups', 'FinTech', 'Healthcare', 'Sustainability', 'Innovation'],
    ARRAY['Tech Leaders', 'Entrepreneurs', 'Investors', 'Developers', 'Executives'],
    'fa157831-4210-452d-805a-2c97e418ea09',
    'https://example.com/leap2025-map.png',
    'https://example.com/leap2025-3d.glb'
  ),
  -- Seamless Fintech 2026
  (
    'b2222222-2222-2222-2222-222222222222',
    'Seamless Fin-tech 2026',
    'The premier fintech summit in the Middle East, showcasing the latest innovations in payments, banking, and financial technology. Connect with 35,000+ industry professionals and discover the future of finance. Features 500+ exhibitors, 300+ speakers, and cutting-edge demos.',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=200',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
    'Riyadh International Convention Center',
    'King Abdullah Road, Riyadh, Saudi Arabia',
    24.7253,
    46.6892,
    300,
    '2026-01-20 09:00:00+03',
    '2026-01-25 18:00:00+03',
    ARRAY['FinTech', 'Technology', 'Networking', 'Startups', 'Conferences', 'AI', 'Payments', 'Security'],
    ARRAY['Finance Professionals', 'Bankers', 'Fintech Founders', 'Investors'],
    'fa157831-4210-452d-805a-2c97e418ea09',
    'https://example.com/seamless2026-map.png',
    NULL
  ),
  -- EXPO 2025 Osaka (Note: Real dates)
  (
    'c3333333-3333-3333-3333-333333333333',
    'EXPO 2025 Osaka',
    'World Exposition 2025 - Designing Future Society for Our Lives. Experience the future of humanity through innovative pavilions from 150+ countries, cultural exchanges, and cutting-edge technology displays. A once-in-a-lifetime event celebrating human achievement and possibility on Yumeshima Island.',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=200',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
    'Yumeshima Island',
    'Yumeshima, Konohana-ku, Osaka, Japan',
    34.6492,
    135.4037,
    2000,
    '2025-04-13 10:00:00+09',
    '2025-10-13 22:00:00+09',
    ARRAY['Technology', 'Arts & Culture', 'Sustainability', 'Education', 'Food & Beverage', 'Future', 'Innovation'],
    ARRAY['Global Citizens', 'Families', 'Business Leaders', 'Students', 'Tourists'],
    'fa157831-4210-452d-805a-2c97e418ea09',
    'https://example.com/expo2025-map.png',
    'https://example.com/expo2025-3d.glb'
  ),
  -- Future of Work Summit 2026
  (
    'd4444444-4444-4444-4444-444444444444',
    'Future of Work Summit 2026',
    'Reshaping the workplace of tomorrow. Join 8,500+ HR leaders, executives, and innovators to explore the future of work, from AI-powered productivity to hybrid workplace strategies. Three days of insights on talent management, remote work best practices, and organizational transformation.',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=200',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
    'ExCeL London',
    'Royal Victoria Dock, 1 Western Gateway, London E16 1XL, UK',
    51.5087,
    0.0297,
    400,
    '2026-05-05 09:00:00+01',
    '2026-05-07 17:00:00+01',
    ARRAY['Technology', 'Education', 'Networking', 'Conferences', 'AI & ML', 'Business', 'Career'],
    ARRAY['HR Leaders', 'Executives', 'Entrepreneurs', 'Remote Workers'],
    'fa157831-4210-452d-805a-2c97e418ea09',
    'https://example.com/futureofwork-map.png',
    NULL
  ),
  -- Connect (X) Dubai 2026
  (
    'e5555555-5555-5555-5555-555555555555',
    'Connect (X) 2026',
    'Connect (X) brings together entrepreneurs, investors, and tech leaders to foster connections and drive innovation in the MENA startup ecosystem. Features pitch competitions, networking sessions, and exclusive investor meetups.',
    'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=200',
    'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800',
    'Dubai World Trade Centre',
    'Sheikh Zayed Road, Trade Centre 2, Dubai, UAE',
    25.2285,
    55.2872,
    350,
    '2026-05-12 09:00:00+04',
    '2026-05-14 18:00:00+04',
    ARRAY['Tech', 'Startups', 'Investment', 'Networking', 'Innovation'],
    ARRAY['Founders', 'Investors', 'VCs', 'Tech Professionals'],
    'fa157831-4210-452d-805a-2c97e418ea09',
    'https://example.com/connectx-map.png',
    NULL
  ),
  -- Past Events
  (
    'f6666666-6666-6666-6666-666666666666',
    'Data Science Conference 2024',
    'The annual gathering of data scientists, AI researchers, and analytics professionals. Three days of workshops, keynotes, and hands-on learning featuring leading experts from Google, Meta, and OpenAI.',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=200',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
    'Dubai World Trade Centre',
    'Sheikh Zayed Road, Dubai, UAE',
    25.2285,
    55.2867,
    300,
    '2024-11-15 09:00:00+04',
    '2024-11-17 18:00:00+04',
    ARRAY['Technology', 'AI & ML', 'Education', 'Workshops', 'Data Science'],
    ARRAY['Data Scientists', 'ML Engineers', 'Researchers', 'Students'],
    'fa157831-4210-452d-805a-2c97e418ea09',
    NULL,
    NULL
  ),
  (
    'a7777777-7777-7777-7777-777777777777',
    'Saudi Agriculture Exhibition 2024',
    'Showcasing innovations in sustainable farming, agritech, and food security for the region. Features 200+ exhibitors presenting smart farming solutions, drone technology, and vertical farming systems.',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=200',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
    'Riyadh International Convention Center',
    'King Abdullah Road, Riyadh, Saudi Arabia',
    24.7253,
    46.6892,
    400,
    '2024-10-08 10:00:00+03',
    '2024-10-10 18:00:00+03',
    ARRAY['Sustainability', 'Technology', 'Food & Beverage', 'Conferences', 'Agriculture'],
    ARRAY['Farmers', 'Agritech Companies', 'Government Officials', 'Investors'],
    'fa157831-4210-452d-805a-2c97e418ea09',
    NULL,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  organizer_id = EXCLUDED.organizer_id;

-- =============================================================================
-- AGENDA ITEMS (for LEAP 2025)
-- Using x_position and y_position for venue map coordinates
-- =============================================================================

INSERT INTO agenda_items (id, event_id, title, description, location_name, floor, x_position, y_position, start_time, end_time)
VALUES
  -- Day 1 - February 9, 2025
  (
    '11111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Registration & Coffee',
    'Pick up your badge and enjoy networking with fellow attendees. Coffee and refreshments provided.',
    'Main Lobby',
    1,
    50.0,
    20.0,
    '2025-02-09 08:00:00+03',
    '2025-02-09 09:00:00+03'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'Opening Keynote: The Future of AI',
    'Dr. Sarah Chen shares her vision for AI transformation across industries. Learn about the latest breakthroughs and what they mean for business.',
    'Main Hall A',
    1,
    150.0,
    100.0,
    '2025-02-09 09:00:00+03',
    '2025-02-09 10:30:00+03'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'a1111111-1111-1111-1111-111111111111',
    'Panel: Digital Transformation in Energy',
    'Industry leaders from Aramco, NEOM, and ACWA Power discuss the digital revolution in the energy sector.',
    'Auditorium A',
    1,
    200.0,
    80.0,
    '2025-02-09 11:00:00+03',
    '2025-02-09 12:30:00+03'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'a1111111-1111-1111-1111-111111111111',
    'Networking Lunch',
    'Enjoy lunch while connecting with speakers and attendees. Halal options available.',
    'Exhibition Hall',
    1,
    100.0,
    200.0,
    '2025-02-09 12:30:00+03',
    '2025-02-09 14:00:00+03'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'a1111111-1111-1111-1111-111111111111',
    'Workshop: AI in Healthcare',
    'Hands-on workshop exploring AI applications in medical diagnostics with Fatima Khan from NEOM Health.',
    'Room 301',
    3,
    80.0,
    150.0,
    '2025-02-09 14:30:00+03',
    '2025-02-09 16:30:00+03'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'a1111111-1111-1111-1111-111111111111',
    'Blockchain Revolution',
    'Maria Santos presents the future of decentralized finance and blockchain applications in enterprise.',
    'Room 302',
    3,
    120.0,
    150.0,
    '2025-02-09 14:30:00+03',
    '2025-02-09 16:00:00+03'
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'a1111111-1111-1111-1111-111111111111',
    'Scaling Cloud Infrastructure',
    'James Wilson shares strategies for building scalable systems that handle millions of users.',
    'Auditorium B',
    2,
    180.0,
    120.0,
    '2025-02-09 16:30:00+03',
    '2025-02-09 17:30:00+03'
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    'a1111111-1111-1111-1111-111111111111',
    'Evening Networking Reception',
    'Join us for drinks, appetizers, and entertainment in the exhibition hall. Live music and demo booths.',
    'Exhibition Hall',
    1,
    100.0,
    200.0,
    '2025-02-09 18:00:00+03',
    '2025-02-09 21:00:00+03'
  ),
  -- Day 2 - February 10, 2025
  (
    '99999999-9999-9999-9999-999999999999',
    'a1111111-1111-1111-1111-111111111111',
    'VIP Breakfast',
    'Exclusive breakfast for speakers and VIP attendees. Network with industry leaders.',
    'VIP Lounge',
    3,
    50.0,
    50.0,
    '2025-02-10 08:00:00+03',
    '2025-02-10 09:30:00+03'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'a1111111-1111-1111-1111-111111111111',
    'Startup Pitch Competition - Round 1',
    '20 startups compete for $1M in funding. Watch live pitches and vote for your favorites.',
    'Main Hall A',
    1,
    150.0,
    100.0,
    '2025-02-10 10:00:00+03',
    '2025-02-10 12:30:00+03'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'a1111111-1111-1111-1111-111111111111',
    'Workshop: Cloud Architecture Patterns',
    'Deep dive into modern cloud architecture with hands-on AWS/Azure/GCP labs.',
    'Room 303',
    3,
    160.0,
    150.0,
    '2025-02-10 14:00:00+03',
    '2025-02-10 17:00:00+03'
  ),
  -- Day 3 - February 11, 2025
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'a1111111-1111-1111-1111-111111111111',
    'The Future of Generative AI',
    'Where is AI headed in the next 5 years? Panel discussion with leading AI researchers.',
    'Main Hall A',
    1,
    150.0,
    100.0,
    '2025-02-11 09:00:00+03',
    '2025-02-11 10:30:00+03'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'a1111111-1111-1111-1111-111111111111',
    'Startup Pitch Finals',
    'Top 5 startups compete in the finals. $1M prize announcement.',
    'Main Hall A',
    1,
    150.0,
    100.0,
    '2025-02-11 14:00:00+03',
    '2025-02-11 16:00:00+03'
  ),
  -- Day 4 - February 12, 2025
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'a1111111-1111-1111-1111-111111111111',
    'Closing Keynote: Vision 2030 & Tech',
    'How technology is driving Saudi Arabia''s Vision 2030 transformation.',
    'Main Hall A',
    1,
    150.0,
    100.0,
    '2025-02-12 10:00:00+03',
    '2025-02-12 11:30:00+03'
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'a1111111-1111-1111-1111-111111111111',
    'Closing Ceremony & Awards',
    'Celebrating the best of LEAP 2025. Awards, highlights, and see you next year!',
    'Main Hall A',
    1,
    150.0,
    100.0,
    '2025-02-12 16:00:00+03',
    '2025-02-12 18:00:00+03'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- =============================================================================
-- REGISTRATIONS (using only the 2 existing users)
-- =============================================================================

INSERT INTO registrations (id, user_id, event_id, status, qr_code, registered_at)
VALUES
  -- Organizer registered for all events
  (
    '11111111-1111-1111-1111-111111111111',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'a1111111-1111-1111-1111-111111111111',
    'registered',
    'LEAP2025-ORG-001',
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'b2222222-2222-2222-2222-222222222222',
    'registered',
    'SEAMLESS2026-ORG-001',
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'c3333333-3333-3333-3333-333333333333',
    'registered',
    'EXPO2025-ORG-001',
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'd4444444-4444-4444-4444-444444444444',
    'registered',
    'FOW2026-ORG-001',
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'e5555555-5555-5555-5555-555555555555',
    'registered',
    'CONNECTX2026-ORG-001',
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'f6666666-6666-6666-6666-666666666666',
    'registered',
    'DSC2024-ORG-001',
    '2024-11-14 10:00:00+04'
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'a7777777-7777-7777-7777-777777777777',
    'registered',
    'AGRI2024-ORG-001',
    '2024-10-07 10:00:00+03'
  ),
  -- Attendee registered for some events
  (
    '88888888-8888-8888-8888-888888888888',
    'c9e9eae7-b057-40f1-943d-3faad0a13941',
    'a1111111-1111-1111-1111-111111111111',
    'registered',
    'LEAP2025-ATT-001',
    NOW()
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    'c9e9eae7-b057-40f1-943d-3faad0a13941',
    'b2222222-2222-2222-2222-222222222222',
    'registered',
    'SEAMLESS2026-ATT-001',
    NOW()
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'c9e9eae7-b057-40f1-943d-3faad0a13941',
    'c3333333-3333-3333-3333-333333333333',
    'registered',
    'EXPO2025-ATT-001',
    NOW()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'c9e9eae7-b057-40f1-943d-3faad0a13941',
    'e5555555-5555-5555-5555-555555555555',
    'registered',
    'CONNECTX2026-ATT-001',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;

-- =============================================================================
-- POSTS (for social feed - using only 2 existing users)
-- =============================================================================

INSERT INTO posts (id, user_id, event_id, content, image_url, likes_count, comments_count)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'a1111111-1111-1111-1111-111111111111',
    'Excited to announce LEAP 2025 is coming! As an organizer, I can''t wait to bring together the world''s brightest minds in tech. See you all in Riyadh! 🚀 #LEAP2025 #Technology #Innovation',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600',
    245,
    42
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'c9e9eae7-b057-40f1-943d-3faad0a13941',
    'a1111111-1111-1111-1111-111111111111',
    'Just registered for LEAP 2025! Looking forward to meeting other attendees and exploring the latest tech innovations. Who else is going? Let''s connect! #LEAP2025 #Networking',
    NULL,
    87,
    23
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'b2222222-2222-2222-2222-222222222222',
    'Seamless Fin-tech 2026 registrations are now open! Join us for the premier fintech summit in the Middle East. 💰 #FinTech #Seamless2026',
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600',
    156,
    31
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'c9e9eae7-b057-40f1-943d-3faad0a13941',
    'c3333333-3333-3333-3333-333333333333',
    'Can''t wait for EXPO 2025 Osaka! The theme "Designing Future Society for Our Lives" really resonates with me. Anyone else planning to attend? 🇯🇵 #EXPO2025 #Osaka',
    NULL,
    198,
    55
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'e5555555-5555-5555-5555-555555555555',
    'Connect (X) 2026 is going to be massive! Bringing together entrepreneurs, investors, and tech leaders in Dubai. Early bird registration now open! 🌟 #ConnectX #Startups #Dubai',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600',
    134,
    28
  )
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  likes_count = EXCLUDED.likes_count;

-- =============================================================================
-- COMMENTS (on posts - using only 2 existing users)
-- =============================================================================

INSERT INTO comments (id, post_id, user_id, content)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'c9e9eae7-b057-40f1-943d-3faad0a13941',
    'Can''t wait! Already registered and ready to go! 🙌'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'Great to have you! Looking forward to meeting you at the event!'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'c9e9eae7-b057-40f1-943d-3faad0a13941',
    'Fintech is the future! Definitely attending this one.'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'Japan is amazing! You''ll love it. Make sure to visit the innovation pavilions!'
  )
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content;

-- =============================================================================
-- POST LIKES (using only 2 existing users)
-- =============================================================================

INSERT INTO post_likes (id, post_id, user_id)
VALUES
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c9e9eae7-b057-40f1-943d-3faad0a13941'),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'fa157831-4210-452d-805a-2c97e418ea09'),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'c9e9eae7-b057-40f1-943d-3faad0a13941'),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'fa157831-4210-452d-805a-2c97e418ea09'),
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'c9e9eae7-b057-40f1-943d-3faad0a13941')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- FRIENDSHIPS (connection between the 2 users)
-- =============================================================================

INSERT INTO friendships (id, requester_id, addressee_id, status)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'c9e9eae7-b057-40f1-943d-3faad0a13941',
    'accepted'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;

-- =============================================================================
-- AI MATCHES (between the 2 users)
-- =============================================================================

INSERT INTO ai_matches (id, user_id, matched_user_id, event_id, score, reasons)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'c9e9eae7-b057-40f1-943d-3faad0a13941',
    'a1111111-1111-1111-1111-111111111111',
    92,
    ARRAY['Both attending LEAP 2025', 'Technology interest match', 'Networking goals aligned']
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'c9e9eae7-b057-40f1-943d-3faad0a13941',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'a1111111-1111-1111-1111-111111111111',
    92,
    ARRAY['Event organizer connection', 'Business networking opportunity', 'Startup ecosystem']
  )
ON CONFLICT (id) DO UPDATE SET
  score = EXCLUDED.score,
  reasons = EXCLUDED.reasons;

-- =============================================================================
-- MESSAGES (between the 2 users)
-- =============================================================================

INSERT INTO messages (id, sender_id, receiver_id, content, read)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'c9e9eae7-b057-40f1-943d-3faad0a13941',
    'Welcome to LEAP 2025! As the organizer, I wanted to personally reach out. Let me know if you have any questions!',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'c9e9eae7-b057-40f1-943d-3faad0a13941',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'Thank you! I''m really excited about the event. The agenda looks amazing!',
    true
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'c9e9eae7-b057-40f1-943d-3faad0a13941',
    'Great to hear! Don''t miss the opening keynote - it''s going to be spectacular. See you there!',
    false
  )
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content;

-- =============================================================================
-- MEETING APPOINTMENTS (between the 2 users)
-- =============================================================================

INSERT INTO meeting_appointments (id, requester_id, invitee_id, event_id, title, description, location, scheduled_time, duration_minutes, status)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'c9e9eae7-b057-40f1-943d-3faad0a13941',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'a1111111-1111-1111-1111-111111111111',
    'Meet the Organizer',
    'Quick chat to learn more about LEAP and networking opportunities',
    'VIP Lounge, Floor 3',
    '2025-02-10 13:00:00+03',
    30,
    'accepted'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;

-- =============================================================================
-- CHECK-INS (sample attendance records for the 2 users)
-- =============================================================================

INSERT INTO check_ins (id, user_id, event_id, type, timestamp, latitude, longitude)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'f6666666-6666-6666-6666-666666666666',
    'check_in',
    '2024-11-15 09:15:00+04',
    25.2285,
    55.2867
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'f6666666-6666-6666-6666-666666666666',
    'check_out',
    '2024-11-15 18:30:00+04',
    25.2285,
    55.2867
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- BEACON DETECTIONS (sample indoor positioning data)
-- =============================================================================

INSERT INTO beacon_detections (id, user_id, event_id, beacon_id, rssi, detected_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'f6666666-6666-6666-6666-666666666666',
    'BEACON-LOBBY-001',
    -65,
    '2024-11-15 09:15:00+04'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'fa157831-4210-452d-805a-2c97e418ea09',
    'f6666666-6666-6666-6666-666666666666',
    'BEACON-HALL-A-002',
    -55,
    '2024-11-15 10:00:00+04'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================
SELECT 'Seed data inserted successfully!' AS status;
