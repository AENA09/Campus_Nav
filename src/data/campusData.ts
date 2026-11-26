export type LocationCategory =
  | 'Academics'
  | 'Food'
  | 'Hostels'
  | 'Sports'
  | 'Utilities';

export const CATEGORIES: readonly ('All' | LocationCategory)[] = [
  'All',
  'Academics',
  'Food',
  'Hostels',
  'Sports',
  'Utilities',
] as const;

export interface FloorInfo {
  level: string;
  details: string;
}

export interface CampusLocation {
  id: string;
  name: string;
  shortName: string;
  code: string;
  category: LocationCategory;
  x: number;
  y: number;
  summary: string;
  departments: string[];
  floors: FloorInfo[];
  timings: string;
  wheelchairAccessible: boolean;
  accessibilityNote: string;
  keywords: string[];
}

export interface WalkwayJunction {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface CampusEdge {
  id: string;
  from: string;
  to: string;
  distance: number; // meters
  accessible: boolean;
  hasStairs?: boolean;
  pathName: string;
}

/**
 * 15 navigable landmarks across Medi-Caps University, Indore (Pigdamber, Rau, AB Road)
 * Coordinates mapped onto a 1000 x 700 SVG campus canvas aligned with the real campus layout.
 */
export const CAMPUS_LOCATIONS: CampusLocation[] = [
  {
    id: 'main-gate',
    name: 'Main Entrance Gate & Security Checkpost',
    shortName: 'Main Gate',
    code: 'GATE-1',
    category: 'Utilities',
    x: 345,
    y: 618,
    summary:
      'Primary university entrance off AB Road (NH-52), Pigdamber. Features 24/7 security checkpost, visitor pass desk, and campus shuttle drop-off.',
    departments: ['Campus Security', 'Visitor Information Desk', 'Transport & Bus Control'],
    floors: [
      { level: 'Ground', details: 'Security Checkpost, Visitor Gate Pass Counter, E-Cart Bay' },
    ],
    timings: 'Open 24 Hours (Visitor Entry: 8:00 AM – 7:00 PM)',
    wheelchairAccessible: true,
    accessibilityNote: 'Level paved boulevard entry with tactile curb ramps.',
    keywords: ['entry', 'exit', 'ab road', 'pigdamber', 'security', 'bus', 'gate', 'guard'],
  },
  {
    id: 'parking-area',
    name: 'Central Parking Area',
    shortName: 'Central Parking',
    code: 'PARK',
    category: 'Utilities',
    x: 235,
    y: 578,
    summary:
      'Dedicated student, faculty, and university bus parking zone positioned along the western AB Road boundary next to the playground.',
    departments: ['Two-Wheeler Parking Bay', 'Four-Wheeler Zone', 'University Bus Fleet Depot'],
    floors: [
      { level: 'Zone A', details: 'Student Two-Wheeler Shaded Parking & EV Charging' },
      { level: 'Zone B', details: 'Faculty Four-Wheeler Parking & Accessible Bays' },
      { level: 'Zone C', details: 'Medi-Caps Bus Fleet Boarding Lane' },
    ],
    timings: '6:30 AM – 9:30 PM',
    wheelchairAccessible: true,
    accessibilityNote: 'Designated accessible parking bays with step-free walkway to Main Gate.',
    keywords: ['parking', 'bike', 'car', 'bus', 'vehicle', 'ev', 'transport'],
  },
  {
    id: 'medical-room',
    name: 'Medical & First-Aid Room',
    shortName: 'Medical Room',
    code: 'MED',
    category: 'Utilities',
    x: 405,
    y: 535,
    summary:
      'On-campus primary healthcare and emergency first-aid infirmary located near the main entrance courtyard with a standby ambulance bay.',
    departments: ['First-Aid & Trauma Care', 'On-Call University Physician', 'Ambulance Dispatch'],
    floors: [
      { level: 'Ground Floor', details: 'Triage Desk, 4-Bed Observation Bay, Pharmacy Dispensary' },
    ],
    timings: '8:00 AM – 8:00 PM (24/7 Emergency On-Call)',
    wheelchairAccessible: true,
    accessibilityNote: 'Direct ground-level ramp entrance with wheelchair availability.',
    keywords: ['doctor', 'nurse', 'clinic', 'hospital', 'first aid', 'ambulance', 'health', 'medical'],
  },
  {
    id: 'admin-block',
    name: 'Administrative Block (Admin Block)',
    shortName: 'Admin Block',
    code: 'ADMIN',
    category: 'Academics',
    x: 478,
    y: 562,
    summary:
      'Central governance and student services complex housing Admissions, Registrar Office, Accounts, Examination Cell, and University Leadership.',
    departments: [
      'Admissions & Counseling Cell',
      'Registrar Office',
      'Accounts & Fee Counter',
      'Examination & Transcript Cell',
      'Scholarship & ERP Helpdesk',
    ],
    floors: [
      { level: 'Ground Floor', details: 'Reception, Admissions Desk, Accounts & Fee Counters' },
      { level: '1st Floor', details: 'Registrar Office, Examination Cell, Student Records' },
      { level: '2nd Floor', details: 'Vice-Chancellor Office, Pro-VC, Board Conference Room' },
    ],
    timings: 'Mon – Sat, 9:00 AM – 5:00 PM',
    wheelchairAccessible: true,
    accessibilityNote: 'Main porch ramp and central passenger elevator to all floors.',
    keywords: ['admissions', 'registrar', 'accounts', 'fees', 'exam', 'vc', 'office', 'scholarship', 'f-block'],
  },
  {
    id: 'auditorium',
    name: 'Main Auditorium & Seminar Complex',
    shortName: 'Auditorium',
    code: 'AUDI',
    category: 'Academics',
    x: 462,
    y: 468,
    summary:
      'Flagship 1,200-seat acoustically engineered auditorium and multi-hall seminar complex for convocations, hackathons, cultural fests, and technical talks.',
    departments: [
      'Main Convocation Auditorium',
      'ACM Student Chapter Hall',
      'IEEE & Technical Seminar Rooms',
      'Media & AV Control Room',
    ],
    floors: [
      { level: 'Ground Floor', details: 'Main Auditorium Seating, Stage Green Rooms, Exhibition Lobby' },
      { level: '1st Floor', details: 'Balcony Seating, Seminar Halls 1 & 2, Press Gallery' },
    ],
    timings: '8:30 AM – 7:00 PM (Extended during campus events)',
    wheelchairAccessible: true,
    accessibilityNote: 'Step-free foyer entry with reserved front-aisle wheelchair seating.',
    keywords: ['auditorium', 'seminar', 'event', 'acm', 'moonstone', 'hall', 'convocation', 'stage'],
  },
  {
    id: 'a-block',
    name: 'A-Block (First Year & Basic Sciences)',
    shortName: 'A-Block',
    code: 'A-BLK',
    category: 'Academics',
    x: 668,
    y: 538,
    summary:
      'Dedicated academic building for First-Year B.Tech foundation courses, Applied Sciences laboratories, and Humanities & Communication studios.',
    departments: [
      'First Year Engineering',
      'Applied Physics',
      'Applied Chemistry',
      'Engineering Mathematics',
      'Humanities & Communication Lab',
    ],
    floors: [
      { level: 'Ground Floor', details: 'Physics & Chemistry Labs, Engineering Graphics Hall' },
      { level: '1st Floor', details: 'First-Year Lecture Rooms (A-101 to A-118), Faculty Cabins' },
      { level: '2nd Floor', details: 'Mathematics Dept., Language & Soft-Skills Studio' },
    ],
    timings: 'Mon – Sat, 8:15 AM – 5:30 PM',
    wheelchairAccessible: true,
    accessibilityNote: 'Accessible south avenue entry ramp and east-wing elevator.',
    keywords: ['first year', 'physics', 'chemistry', 'maths', 'basic sciences', 'humanities', 'a block'],
  },
  {
    id: 'b-block',
    name: 'B-Block (CSE & IT Labs)',
    shortName: 'B-Block (CSE)',
    code: 'B-BLK',
    category: 'Academics',
    x: 794,
    y: 558,
    summary:
      'Hub of Computer Science & Engineering and Information Technology, featuring high-performance computing clusters, AI/ML studios, and software innovation labs.',
    departments: [
      'Computer Science & Engineering (CSE)',
      'Information Technology (IT)',
      'AI, Machine Learning & Data Science',
      'Cybersecurity & Cloud Computing Labs',
      'Competitive Coding & Innovation Cell',
    ],
    floors: [
      { level: 'Ground Floor', details: 'CSE HOD Office, Programming Labs 1–4, Server Core' },
      { level: '1st Floor', details: 'AI/ML & Data Science Labs, Smart Classrooms (B-101 to B-116)' },
      { level: '2nd Floor', details: 'IT Department, Cloud & Networking Lab, Project Incubation Hub' },
      { level: '3rd Floor', details: 'Research Scholars Studio, Capstone Seminar Hall' },
    ],
    timings: 'Mon – Sat, 8:15 AM – 6:30 PM',
    wheelchairAccessible: true,
    accessibilityNote: 'Wide paved courtyard approach with dual ramps and elevator access.',
    keywords: ['cse', 'computer science', 'it', 'coding', 'ai', 'ml', 'software', 'labs', 'b block', 'data science'],
  },
  {
    id: 'c-block',
    name: 'C-Block (ECE, EE & Mechanical)',
    shortName: 'C-Block',
    code: 'C-BLK',
    category: 'Academics',
    x: 718,
    y: 616,
    summary:
      'Core engineering block housing Electronics & Communication, Electrical Engineering, and Mechanical workshops with heavy machinery and robotics labs.',
    departments: [
      'Electronics & Communication (ECE)',
      'Electrical Engineering (EE)',
      'Mechanical Engineering (ME)',
      'VLSI, IoT & Embedded Systems Lab',
      'CAD/CAM & Robotics Workshop',
    ],
    floors: [
      { level: 'Ground Floor', details: 'Central Mechanical Workshop, CNC & Thermal Labs, High Voltage Lab' },
      { level: '1st Floor', details: 'ECE Digital Electronics, VLSI & Embedded IoT Labs' },
      { level: '2nd Floor', details: 'CAD/CAM Design Studio, Lecture Halls (C-201 to C-214)' },
    ],
    timings: 'Mon – Sat, 8:15 AM – 5:30 PM',
    wheelchairAccessible: true,
    accessibilityNote: 'Ground-level workshop access and lift in the central atrium.',
    keywords: ['ece', 'electronics', 'electrical', 'ee', 'mechanical', 'me', 'robotics', 'workshop', 'cad', 'c block'],
  },
  {
    id: 'central-library',
    name: 'Central Library & E-Resource Center',
    shortName: 'Central Library',
    code: 'LIB',
    category: 'Academics',
    x: 572,
    y: 378,
    summary:
      'Multi-level academic knowledge center overlooking the Central Quadrangle, offering 100,000+ print volumes, digital journals, and silent study zones.',
    departments: [
      'Circulation & Book Issue Desk',
      'Digital E-Resource & IEEE Center',
      'Silent Reading Hall',
      'Reference & Thesis Archive',
      'Group Study Pods',
    ],
    floors: [
      { level: 'Ground Floor', details: 'Issue/Return Desk, Newspaper Lounge, Bag Deposit' },
      { level: '1st Floor', details: 'Engineering & Management Book Stacks, Silent Study Hall' },
      { level: '2nd Floor', details: 'E-Resource Terminals (IEEE, Springer, Scopus), Research Pods' },
    ],
    timings: 'Mon – Sat, 8:00 AM – 8:00 PM (Exam Weeks: Open till 10:00 PM)',
    wheelchairAccessible: true,
    accessibilityNote: 'Barrier-free plaza entrance, wide aisle stacks, and quiet study lift.',
    keywords: ['library', 'books', 'study', 'reading', 'e-resource', 'journal', 'ieee', 'q-block', 'quiet'],
  },
  {
    id: 'canteen',
    name: 'Central Canteen & Nescafé Food Court',
    shortName: 'Canteen & Nescafé',
    code: 'FOOD',
    category: 'Food',
    x: 478,
    y: 332,
    summary:
      'Vibrant campus dining square serving hot Indian meals, snacks, fresh juices, and the popular Nescafé coffee kiosk beside the central lawns.',
    departments: [
      'Central University Canteen',
      'Nescafé Coffee & Bakery Kiosk',
      'Fresh Juice & Chaat Counter',
      'Shaded Student Dining Plaza',
    ],
    floors: [
      { level: 'Ground Level', details: 'Main Dining Hall, Self-Service Counters, Nescafé Outdoor Patio' },
    ],
    timings: 'Mon – Sat, 8:00 AM – 7:30 PM',
    wheelchairAccessible: true,
    accessibilityNote: 'Flush paved patio seating and wide counter lanes.',
    keywords: ['food', 'canteen', 'nescafe', 'coffee', 'lunch', 'snacks', 'cafe', 'tea', 'breakfast', 'eat'],
  },
  {
    id: 'm-block',
    name: 'M-Block (Management & Commerce)',
    shortName: 'M-Block',
    code: 'M-BLK',
    category: 'Academics',
    x: 588,
    y: 212,
    summary:
      'Home to the Faculty of Management Studies and Commerce with tiered case-study rooms, finance trading lab, and the Central Training & Placement Cell.',
    departments: [
      'Faculty of Management Studies (MBA / BBA)',
      'Department of Commerce (B.Com Hons)',
      'Training & Placement Cell (T&P)',
      'Bloomberg & Finance Analytics Lab',
      'Entrepreneurship Development Cell',
    ],
    floors: [
      { level: 'Ground Floor', details: 'Training & Placement Cell, Corporate Interview Suites' },
      { level: '1st Floor', details: 'BBA & Commerce Classrooms, Faculty Courtyard' },
      { level: '2nd Floor', details: 'MBA Case-Study Amphitheatres, Business Analytics Lab' },
    ],
    timings: 'Mon – Sat, 8:30 AM – 5:30 PM',
    wheelchairAccessible: true,
    accessibilityNote: 'Accessible via North Garden Avenue ramp (avoid terrace stairs from Canteen).',
    keywords: ['mba', 'bba', 'management', 'commerce', 'bcom', 'placement', 't&p', 'finance', 'm block'],
  },
  {
    id: 'v-block',
    name: 'V-Block (Pharmacy & Forensic Science)',
    shortName: 'V-Block',
    code: 'V-BLK',
    category: 'Academics',
    x: 748,
    y: 160,
    summary:
      'Distinctive triple-drum circular architectural landmark housing the Faculty of Pharmacy, Forensic Science laboratories, and Life Sciences wings.',
    departments: [
      'Faculty of Pharmacy (B.Pharm / M.Pharm)',
      'Forensic Science & Criminology',
      'Pharmacology & Pharmaceutics Labs',
      'Agriculture & Biotechnology Dept.',
      'Medicinal Herb Garden',
    ],
    floors: [
      { level: 'Ground Floor', details: 'Pharmaceutics & Pharmacognosy Labs, Instrument Room' },
      { level: '1st Floor', details: 'Forensic Ballistics & Toxicology Lab, Circular Lecture Rooms' },
      { level: '2nd Floor', details: 'M.Pharm Research Labs, Departmental Library & Museum' },
    ],
    timings: 'Mon – Sat, 8:30 AM – 5:30 PM',
    wheelchairAccessible: true,
    accessibilityNote: 'Step-free sloped ramp approach via East Quadrangle & V-Block Ramp Plaza.',
    keywords: ['pharmacy', 'bpharm', 'mpharm', 'forensic', 'science', 'agriculture', 'biotech', 'v block', 'circular'],
  },
  {
    id: 'sports-complex',
    name: 'Sports Complex (Grounds & Courts)',
    shortName: 'Sports Complex',
    code: 'SPORT',
    category: 'Sports',
    x: 245,
    y: 395,
    summary:
      'Expansive western athletic zone along AB Road featuring the full-size Cricket & Football playground, floodlit Basketball & Volleyball courts, and Sports Office.',
    departments: [
      'Cricket & Football Main Ground',
      'Floodlit Basketball Courts (2)',
      'Volleyball & Kabaddi Courts',
      'Indoor Table Tennis & Chess Room',
      'Physical Education & Equipment Desk',
    ],
    floors: [
      { level: 'Outdoor', details: 'Main Cricket Pitch, Football Turf, Basketball & Volleyball Courts' },
      { level: 'Pavilion', details: 'Sports Director Office, Changing Rooms, Equipment Issue' },
    ],
    timings: 'Daily, 6:00 AM – 8:30 PM',
    wheelchairAccessible: true,
    accessibilityNote: 'Level perimeter path around courts and accessible spectator pavilion.',
    keywords: ['sports', 'cricket', 'football', 'basketball', 'volleyball', 'playground', 'gym', 'court', 'ground'],
  },
  {
    id: 's-block',
    name: 'S-Block (Academic & Research Wing)',
    shortName: 'S-Block',
    code: 'S-BLK',
    category: 'Academics',
    x: 852,
    y: 372,
    summary:
      'Eastern academic and research wing overlooking the Central Quadrangle, housing interdisciplinary lecture halls, smart classrooms, and departmental research labs.',
    departments: [
      'Interdisciplinary Engineering & Sciences',
      'Smart Classrooms & Lecture Wing',
      'Innovation & Research Laboratories',
      'Faculty Offices & Seminar Rooms',
    ],
    floors: [
      { level: 'Ground Floor', details: 'Reception Atrium, Laboratories, Accessible Lecture Halls' },
      { level: 'Floors 1 – 3', details: 'Smart Classrooms (S-101 to S-318), Departmental Labs, Faculty Cabins' },
    ],
    timings: 'Mon – Sat, 8:15 AM – 6:00 PM',
    wheelchairAccessible: true,
    accessibilityNote: 'Step-free entrance ramp from East Quadrangle Avenue and passenger elevator.',
    keywords: ['s block', 's-block', 'academics', 'lecture', 'classrooms', 'research', 'labs', 'east wing'],
  },
  {
    id: 'boys-hostel',
    name: 'Boys Hostel',
    shortName: 'Boys Hostel',
    code: 'BH',
    category: 'Hostels',
    x: 416,
    y: 266,
    summary:
      'Student boys residential complex conveniently located next to the Central Canteen and sports grounds, with dining mess, recreation hall, and 24/7 security.',
    departments: [
      'Chief Warden Office (Boys)',
      'Hostel Dining Mess',
      'Indoor Recreation & TV Lounge',
      'Outdoor Badminton Court',
    ],
    floors: [
      { level: 'Ground Floor', details: 'Warden Desk, Dining Mess, Visitor Lounge, Accessible Rooms' },
      { level: 'Floors 1 – 4', details: 'Student Residential Wings, Wi-Fi Study Corners, Water Coolers' },
    ],
    timings: '24/7 Residential Access (Curfew & Visitor Hours apply)',
    wheelchairAccessible: true,
    accessibilityNote: 'Ground-floor residential rooms, paved walkway to Canteen, and elevator access.',
    keywords: ['boys hostel', 'hostel', 'dorm', 'mess', 'residence', 'stay', 'accommodation', 'canteen'],
  },
  {
    id: 'girls-hostel',
    name: 'Girls Hostel',
    shortName: 'Girls Hostel',
    code: 'GH',
    category: 'Hostels',
    x: 844,
    y: 263,
    summary:
      'Secured girls residential complex situated between V-Block and S-Block with biometric entry, dedicated dining hall, quiet study lounge, and 24/7 female warden support.',
    departments: [
      'Girls Hostel Warden Office',
      'Residential Dining Hall',
      'Common Study & Reading Room',
      '24/7 Biometric Security Gate',
    ],
    floors: [
      { level: 'Ground Floor', details: 'Security Reception, Warden Office, Dining Hall, Accessible Rooms' },
      { level: 'Floors 1 – 4', details: 'Residential Suites, Laundry Bay, Terrace Common Area' },
    ],
    timings: '24/7 Residential Access (Authorized Entry Only)',
    wheelchairAccessible: true,
    accessibilityNote: 'Step-free paved approach from V-Block Ramp Plaza and East Quadrangle Avenue.',
    keywords: ['girls hostel', 'hostel', 'dorm', 'mess', 'residence', 'stay', 'women', 'v-block', 's-block'],
  },
];

/**
 * Intermediate walkway junctions so routes follow paved campus avenues, lawns, and corridors.
 */
export const WALKWAY_JUNCTIONS: WalkwayJunction[] = [
  { id: 'j-gate-entry', name: 'Main Entrance Boulevard', x: 356, y: 558 },
  { id: 'j-west-drive', name: 'West Campus Drive', x: 334, y: 468 },
  { id: 'j-court-north', name: 'Sports Court Crossing', x: 386, y: 368 },
  { id: 'j-central-hub', name: 'Central Fountain Plaza', x: 516, y: 382 },
  { id: 'j-south-avenue', name: 'South Academic Avenue', x: 572, y: 555 },
  { id: 'j-south-east', name: 'Engineering Block Crossroads', x: 730, y: 565 },
  { id: 'j-quad-south', name: 'South Quadrangle Walkway', x: 664, y: 454 },
  { id: 'j-quad-east', name: 'East Quadrangle Avenue', x: 768, y: 375 },
  { id: 'j-quad-north', name: 'North Quadrangle Terrace', x: 662, y: 292 },
  { id: 'j-north-plaza', name: 'North Garden Avenue', x: 498, y: 238 },
  { id: 'j-vblock-ramp', name: 'V-Block Accessible Ramp Plaza', x: 716, y: 248 },
];

export type GraphNode = (CampusLocation & { isLandmark: true }) | (WalkwayJunction & { isLandmark: false });

export const ALL_NODES_MAP: Record<string, GraphNode> = {
  ...Object.fromEntries(
    CAMPUS_LOCATIONS.map((loc) => [loc.id, { ...loc, isLandmark: true as const }])
  ),
  ...Object.fromEntries(
    WALKWAY_JUNCTIONS.map((j) => [j.id, { ...j, isLandmark: false as const }])
  ),
};

/**
 * Undirected campus walkway graph.
 * Distances are calibrated in realistic meters (~0.68m per SVG unit) with 3 stepped shortcuts
 * that Wheelchair Accessible mode cleanly reroutes around via paved step-free avenues.
 */
export const CAMPUS_EDGES: CampusEdge[] = [
  // Main Gate & West Entry Zone
  { id: 'e-gate-entry', from: 'main-gate', to: 'j-gate-entry', distance: 42, accessible: true, pathName: 'Main Entrance Boulevard' },
  { id: 'e-gate-parking', from: 'main-gate', to: 'parking-area', distance: 78, accessible: true, pathName: 'AB Road Service Lane' },
  { id: 'e-parking-entry', from: 'parking-area', to: 'j-gate-entry', distance: 84, accessible: true, pathName: 'Parking Pedestrian Walkway' },
  { id: 'e-entry-medical', from: 'j-gate-entry', to: 'medical-room', distance: 38, accessible: true, pathName: 'Infirmary Courtyard Path' },
  { id: 'e-medical-admin', from: 'medical-room', to: 'admin-block', distance: 52, accessible: true, pathName: 'Admin Forecourt' },
  { id: 'e-entry-west', from: 'j-gate-entry', to: 'j-west-drive', distance: 65, accessible: true, pathName: 'West Campus Drive' },

  // Sports & West Avenue
  { id: 'e-west-sports', from: 'j-west-drive', to: 'sports-complex', distance: 76, accessible: true, pathName: 'Playground Pavilion Path' },
  { id: 'e-west-audi', from: 'j-west-drive', to: 'auditorium', distance: 86, accessible: true, pathName: 'Auditorium Foyer Drive' },
  { id: 'e-west-courts', from: 'j-west-drive', to: 'j-court-north', distance: 78, accessible: true, pathName: 'Basketball Court Walkway' },
  { id: 'e-courts-sports', from: 'j-court-north', to: 'sports-complex', distance: 96, accessible: true, pathName: 'North Sports Perimeter Path' },
  { id: 'e-courts-canteen', from: 'j-court-north', to: 'canteen', distance: 66, accessible: true, pathName: 'Food Court Promenade' },
  { id: 'e-courts-northplaza', from: 'j-court-north', to: 'j-north-plaza', distance: 112, accessible: true, pathName: 'West Lawn Boulevard' },

  // Central Hub (Auditorium, Canteen, Central Library)
  { id: 'e-admin-audi', from: 'admin-block', to: 'auditorium', distance: 65, accessible: true, pathName: 'Admin–Auditorium Walkway' },
  { id: 'e-audi-hub', from: 'auditorium', to: 'j-central-hub', distance: 68, accessible: true, pathName: 'Central Plaza Promenade' },
  { id: 'e-canteen-hub', from: 'canteen', to: 'j-central-hub', distance: 44, accessible: true, pathName: 'Nescafé Plaza Path' },
  { id: 'e-hub-library', from: 'j-central-hub', to: 'central-library', distance: 40, accessible: true, pathName: 'Library Porch Path' },

  // South Academic Spine (Admin -> A, B, C Blocks)
  { id: 'e-admin-south', from: 'admin-block', to: 'j-south-avenue', distance: 64, accessible: true, pathName: 'South Academic Avenue' },
  { id: 'e-south-ablock', from: 'j-south-avenue', to: 'a-block', distance: 66, accessible: true, pathName: 'A-Block Academic Walk' },
  { id: 'e-south-cblock', from: 'j-south-avenue', to: 'c-block', distance: 108, accessible: true, pathName: 'Workshop Boulevard' },
  { id: 'e-south-quadsouth', from: 'j-south-avenue', to: 'j-quad-south', distance: 92, accessible: true, pathName: 'Quadrangle Link Road' },
  { id: 'e-ablock-se', from: 'a-block', to: 'j-south-east', distance: 46, accessible: true, pathName: 'Engineering Courtyard' },
  { id: 'e-se-bblock', from: 'j-south-east', to: 'b-block', distance: 45, accessible: true, pathName: 'CSE Block Entrance' },
  { id: 'e-se-cblock', from: 'j-south-east', to: 'c-block', distance: 38, accessible: true, pathName: 'C-Block North Approach' },

  // Central Quadrangle, S-Block & Girls Hostel (East Corridor)
  { id: 'e-lib-quadsouth', from: 'central-library', to: 'j-quad-south', distance: 80, accessible: true, pathName: 'South Quadrangle Walkway' },
  { id: 'e-ablock-quadsouth', from: 'a-block', to: 'j-quad-south', distance: 58, accessible: true, pathName: 'First-Year Lawn Path' },
  { id: 'e-quadsouth-quadeast', from: 'j-quad-south', to: 'j-quad-east', distance: 88, accessible: true, pathName: 'East Quadrangle Avenue' },
  { id: 'e-bblock-quadeast', from: 'b-block', to: 'j-quad-east', distance: 126, accessible: true, pathName: 'East Engineering Drive' },
  { id: 'e-quadeast-sblock', from: 'j-quad-east', to: 's-block', distance: 58, accessible: true, pathName: 'S-Block Forecourt Road' },
  { id: 'e-quadeast-vramp', from: 'j-quad-east', to: 'j-vblock-ramp', distance: 92, accessible: true, pathName: 'East Campus Accessible Rampway' },
  { id: 'e-sblock-girls', from: 's-block', to: 'girls-hostel', distance: 76, accessible: true, pathName: 'East Residential Promenade' },
  { id: 'e-quadeast-girls', from: 'j-quad-east', to: 'girls-hostel', distance: 94, accessible: true, pathName: 'Girls Hostel South Approach' },
  { id: 'e-vramp-girls', from: 'j-vblock-ramp', to: 'girls-hostel', distance: 88, accessible: true, pathName: 'Girls Hostel Gate Walkway' },
  { id: 'e-vblock-girls', from: 'v-block', to: 'girls-hostel', distance: 96, accessible: true, pathName: 'V-Block–Hostel Connector' },

  // North Academic & Boys Hostel (near Canteen)
  { id: 'e-lib-quadnorth', from: 'central-library', to: 'j-quad-north', distance: 84, accessible: true, pathName: 'Central Academic Spine' },
  { id: 'e-quadnorth-mblock', from: 'j-quad-north', to: 'm-block', distance: 74, accessible: true, pathName: 'Management Block South Ramp' },
  { id: 'e-quadnorth-vramp', from: 'j-quad-north', to: 'j-vblock-ramp', distance: 56, accessible: true, pathName: 'North Quadrangle Ramp Path' },
  { id: 'e-vramp-vblock', from: 'j-vblock-ramp', to: 'v-block', distance: 66, accessible: true, pathName: 'V-Block Sloped Approach' },
  { id: 'e-canteen-northplaza', from: 'canteen', to: 'j-north-plaza', distance: 68, accessible: true, pathName: 'North Garden Avenue' },
  { id: 'e-northplaza-mblock', from: 'j-north-plaza', to: 'm-block', distance: 64, accessible: true, pathName: 'M-Block West Walkway' },
  { id: 'e-canteen-boys', from: 'canteen', to: 'boys-hostel', distance: 56, accessible: true, pathName: 'Boys Hostel Canteen Walk' },
  { id: 'e-northplaza-boys', from: 'j-north-plaza', to: 'boys-hostel', distance: 58, accessible: true, pathName: 'Boys Hostel Courtyard Path' },
  { id: 'e-courts-boys', from: 'j-court-north', to: 'boys-hostel', distance: 72, accessible: true, pathName: 'Sports–Hostel Link Path' },

  // Stepped Shortcuts (Excluded when Wheelchair Accessible mode is ON)
  {
    id: 'e-stairs-canteen-mblock',
    from: 'canteen',
    to: 'm-block',
    distance: 92,
    accessible: false,
    hasStairs: true,
    pathName: 'Central Terrace Stone Steps',
  },
  {
    id: 'e-stairs-quad-vblock',
    from: 'j-quad-north',
    to: 'v-block',
    distance: 88,
    accessible: false,
    hasStairs: true,
    pathName: 'Pharmacy Courtyard Stairway',
  },
  {
    id: 'e-stairs-audi-ablock',
    from: 'auditorium',
    to: 'a-block',
    distance: 138,
    accessible: false,
    hasStairs: true,
    pathName: 'Amphitheatre Stepped Shortcut',
  },
];

export const CATEGORY_COLORS: Record<
  LocationCategory,
  { fill: string; stroke: string; badgeText: string; dot: string }
> = {
  Academics: {
    fill: '#991B1B',
    stroke: '#7F1D1D',
    badgeText: 'text-red-800 dark:text-red-400',
    dot: '#991B1B',
  },
  Food: {
    fill: '#B45309',
    stroke: '#92400E',
    badgeText: 'text-amber-700 dark:text-amber-400',
    dot: '#D97706',
  },
  Hostels: {
    fill: '#1D4ED8',
    stroke: '#1E40AF',
    badgeText: 'text-blue-700 dark:text-blue-400',
    dot: '#2563EB',
  },
  Sports: {
    fill: '#15803D',
    stroke: '#166534',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    dot: '#16A34A',
  },
  Utilities: {
    fill: '#334155',
    stroke: '#1E293B',
    badgeText: 'text-slate-700 dark:text-slate-300',
    dot: '#475569',
  },
};
