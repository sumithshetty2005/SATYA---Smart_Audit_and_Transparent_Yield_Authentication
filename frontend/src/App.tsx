import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreeBackground } from './components/ThreeBackground';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProblemCard } from './components/ProblemCard';
import { ProblemModal } from './components/ProblemModal';
import { TicketFlowModule } from './components/TicketFlowModule';
import { DomainMetricsSection } from './components/DomainMetricsSection';
import { LeaderboardModal } from './components/LeaderboardModal';
import { GuidelinesModal } from './components/GuidelinesModal';
import { Footer } from './components/Footer';
import type { ProblemStatement, PlatformStats } from './types';
import {
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Search,
} from 'lucide-react';

// Seeded Initial Problem Statements for instant, zero-latency initial render
const FALLBACK_STATEMENTS: ProblemStatement[] = [
  {
    id: "AICTE-2027-PS01",
    title: "Real-Time Vedic Manuscript Decipherment & Brahmi OCR Engine",
    domain: "Heritage Tech",
    category: "Software",
    sector: "Government",
    urgency: "Critical",
    difficulty: "Advanced",
    grant_amount: "₹25.0 Lakhs",
    grant_amount_num: 2500000,
    sponsor: "Ministry of Culture & AICTE IKS Division",
    sponsor_logo: "🏛️",
    summary: "Deep vision multi-spectral OCR to transcribe degraded 2nd-century palm-leaf manuscripts in Sharada, Grantha, and Brahmi scripts into Unicode Devanagari and English.",
    description: "India possesses millions of ancient palm-leaf manuscripts containing priceless astronomical, mathematical, and medical treatises. Many are severely decayed. This challenge requires building a transformer-based vision pipeline capable of denoising, token segmenting, and translating ancient script ligatures with provenance cryptographic hashing.",
    tech_stack: ["PyTorch", "Vision Transformer", "OpenCV", "FastAPI", "Neo4j"],
    evaluation_criteria: { "Script Accuracy": 35, "Degradation Robustness": 25, "Translation Semantic Fidelity": 20, "Model Latency": 20 },
    deliverables: ["Offline-capable PyTorch inference model", "Brahmi-to-Devanagari lexicon converter", "Interactive scholar validation dashboard"],
    days_left: 18,
    submissions_count: 42,
    simulation_type: "manuscript_ocr",
  },
  {
    id: "AICTE-2027-PS02",
    title: "Autonomous Micro-Drone Swarm for Sub-Canopy Himalayan Forest Fire Early Detection",
    domain: "Robotics",
    category: "Hybrid",
    sector: "Government",
    urgency: "Critical",
    difficulty: "Expert",
    grant_amount: "₹35.0 Lakhs",
    grant_amount_num: 3500000,
    sponsor: "DRDO & Forest Survey of India",
    sponsor_logo: "🌲",
    summary: "Collaborative edge-AI swarm drones navigating GPS-denied dense pine forests in Uttarakhand to spot thermal anomalies before ignition spreads.",
    description: "Himalayan pine forests suffer devastating fires annually. Satellite thermal imaging suffers latency and canopy obscuration. This challenge tasks teams with developing lightweight autonomous UAVs equipped with optical/thermal edge fusion, decentralized ad-hoc mesh networking, and SLAM without GPS reliance.",
    tech_stack: ["ROS2", "Edge TPU", "Thermal Sensor Fusion", "PX4 Autopilot", "C++"],
    evaluation_criteria: { "Autonomous Navigation": 30, "Thermal Detection Recall": 30, "Battery Efficiency": 20, "Mesh Network Resilience": 20 },
    deliverables: ["Custom drone hardware CAD files", "ROS2 flight controller nodes", "Edge fire classification weights"],
    days_left: 12,
    submissions_count: 29,
    simulation_type: "drone_telemetry",
  },
  {
    id: "AICTE-2027-PS03",
    title: "Quantum-Resistant PKI & Zero-Knowledge Verification for National Academic Degrees",
    domain: "Cybersecurity",
    category: "Software",
    sector: "Government",
    urgency: "High",
    difficulty: "Advanced",
    grant_amount: "₹20.0 Lakhs",
    grant_amount_num: 2000000,
    sponsor: "AICTE DigiLocker National Board",
    sponsor_logo: "🛡️",
    summary: "Post-quantum cryptographic lattice signatures (ML-DSA / Dilithium) and zk-SNARKs enabling verifiable student credentials without disclosing PII.",
    description: "With quantum decryption milestones approaching, educational certificates issued today must remain tamper-proof for 50+ years. Implement an end-to-end credential issuer supporting post-quantum NIST FIPS 204 signatures and zk-proofs for instant employer background checks.",
    tech_stack: ["Rust", "Circom", "NIST Dilithium", "WebAssembly", "TypeScript"],
    evaluation_criteria: { "Cryptographic Rigor": 35, "Verification Speed": 25, "Zero-Knowledge Privacy": 25, "Storage Footprint": 15 },
    deliverables: ["Rust verification library", "zk-SNARK browser verifier", "Benchmarking audit report against classical RSA/ECDSA"],
    days_left: 24,
    submissions_count: 65,
    simulation_type: "quantum_security",
  },
  {
    id: "AICTE-2027-PS04",
    title: "Decentralized Smart Microgrid Dynamic Load Balancer for Rural Colleges",
    domain: "Green Tech",
    category: "Hybrid",
    sector: "Industry",
    urgency: "Medium",
    difficulty: "Intermediate",
    grant_amount: "₹18.0 Lakhs",
    grant_amount_num: 1800000,
    sponsor: "Tata Power Renewable & AICTE Green Campus",
    sponsor_logo: "⚡",
    summary: "IoT-driven edge controller coordinating rooftop solar PV, biogas generators, and battery banks across rural polytechnic campuses.",
    description: "Colleges in tier-3 regions face frequent feeder tripping and diesel generator costs. This challenge seeks an intelligent IoT controller with reinforcement learning for day-ahead solar forecasting and automatic non-critical shed switching.",
    tech_stack: ["ESP32 / FreeRTOS", "Python RL", "MQTT / Modbus", "TimescaleDB", "React"],
    evaluation_criteria: { "Energy Cost Reduction": 30, "Grid Independence Ratio": 30, "Hardware Reliability": 20, "User Interface UX": 20 },
    deliverables: ["Controller PCB schematics", "Predictive load scheduler firmware", "Cloud energy analytics portal"],
    days_left: 31,
    submissions_count: 51,
    simulation_type: "green_grid",
  },
  {
    id: "AICTE-2027-PS05",
    title: "Agentic Neuro-Symbolic Tutor for Multilingual Engineering Mathematics",
    domain: "Smart Education",
    category: "Software",
    sector: "Academic",
    urgency: "High",
    difficulty: "Advanced",
    grant_amount: "₹22.0 Lakhs",
    grant_amount_num: 2200000,
    sponsor: "AICTE NEAT Cell & IIT Madras",
    sponsor_logo: "🎓",
    summary: "Speech-to-concept bilingual AI tutor translating complex calculus and linear algebra into 12 Indian regional languages with step-by-step symbolic proofs.",
    description: "First-generation engineering undergraduates struggle with medium-of-instruction language shifts. This solution merges neural voice synthesis with computer algebra systems (SymPy) to deliver interactive voice-driven tutoring in Tamil, Telugu, Hindi, Marathi, Bengali, and Kannada.",
    tech_stack: ["LangChain", "Bhashini API", "SymPy", "FastAPI", "Web Audio API"],
    evaluation_criteria: { "Mathematical Precision": 35, "Regional Language Naturalness": 30, "Pedagogical Clarity": 20, "Response Latency": 15 },
    deliverables: ["Bilingual interactive math tutor webapp", "Proof generation engine", "Speech acoustic adaptation pipeline"],
    days_left: 15,
    submissions_count: 78,
    simulation_type: "neural_grid",
  },
  {
    id: "AICTE-2027-PS06",
    title: "Real-Time Hyper-Spectral Synthetic Aperture Radar Soil Moisture Mapper",
    domain: "AI/ML",
    category: "Software",
    sector: "Government",
    urgency: "High",
    difficulty: "Expert",
    grant_amount: "₹30.0 Lakhs",
    grant_amount_num: 3000000,
    sponsor: "ISRO EOS & National Remote Sensing Centre",
    sponsor_logo: "🛰️",
    summary: "Deep neural inversion model processing RISAT-1A and NISAR dual-frequency SAR backscatter for meter-scale precision crop water stress estimation.",
    description: "Climate variability threatens kharif harvest yields. Ground moisture sensors are scarce in interior talukas. Participants must build an automated pipeline to ingest radar polarimetry, correct for terrain curvature, and predict root-zone volumetric water content at 10-meter spatial resolution.",
    tech_stack: ["GDAL", "PyTorch Geometric", "Xarray", "CartoPy", "FastAPI"],
    evaluation_criteria: { "RMSE vs In-Situ Sensors": 35, "Processing Throughput": 25, "Cloud Masking Robustness": 20, "Interactive GIS Web Interface": 20 },
    deliverables: ["Geospatial inference Docker container", "Tile server API", "Precision agriculture alert bot"],
    days_left: 22,
    submissions_count: 36,
    simulation_type: "satellite_radar",
  },
  {
    id: "AICTE-2027-PS07",
    title: "Predictive Structural Health Digital Twin for Heritage Stone Monoliths",
    domain: "Heritage Tech",
    category: "Hybrid",
    sector: "Academic",
    urgency: "Medium",
    difficulty: "Intermediate",
    grant_amount: "₹16.0 Lakhs",
    grant_amount_num: 1600000,
    sponsor: "Archaeological Survey of India & AICTE",
    sponsor_logo: "🛕",
    summary: "Acoustic emission piezoelectric sensors and finite element digital twins for non-destructive micro-fracture monitoring of temple pillars.",
    description: "Preserving ancient temple sanctums from seismic vibrations and tourist footfall demands non-invasive continuous diagnostics. Design wireless vibration transceivers feeding a real-time digital twin to detect sub-millimeter stress propagation before visible cracking occurs.",
    tech_stack: ["ANSYS / OpenFOAM", "LoRaWAN", "Python", "Three.js", "PostgreSQL"],
    evaluation_criteria: { "Early Fracture Warning Precision": 30, "Sensor Non-Invasiveness": 30, "Digital Twin Synchronization": 25, "Battery Lifetime": 15 },
    deliverables: ["LoRa sensor nodes", "3D WebGL structural stress dashboard", "Stress prediction model"],
    days_left: 40,
    submissions_count: 19,
    simulation_type: "drone_telemetry",
  },
  {
    id: "AICTE-2027-PS08",
    title: "Zero-Trust Distributed Edge Identity Mesh for University Campuses",
    domain: "Cybersecurity",
    category: "Software",
    sector: "Industry",
    urgency: "Critical",
    difficulty: "Advanced",
    grant_amount: "₹28.0 Lakhs",
    grant_amount_num: 2800000,
    sponsor: "Infosys Springboard & AICTE Cyber Cell",
    sponsor_logo: "🔐",
    summary: "Continuous micro-segmentation and behavioral biometric authentication securing campus research servers and high-performance computing clusters.",
    description: "Ransomware targeting academic institutions has surged. Standard VPN perimeters are obsolete. Deploy an edge zero-trust broker verifying keystroke dynamics, location telemetry, and mTLS attestation before granting lab access.",
    tech_stack: ["Go", "eBPF", "Envoy Proxy", "Redis", "React"],
    evaluation_criteria: { "Zero-Trust Policy Enforcement": 35, "False Rejection Rate (<0.1%)": 30, "Throughput Overhead": 20, "Admin Console Usability": 15 },
    deliverables: ["eBPF network policy filter daemon", "Keycloak / OAuth2 connector", "Incident response SIEM dashboard"],
    days_left: 9,
    submissions_count: 84,
    simulation_type: "quantum_security",
  },
];

export function App() {
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>(FALLBACK_STATEMENTS);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<ProblemStatement | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedUrgency, setSelectedUrgency] = useState('All');
  const [sortBy, setSortBy] = useState<'days_left' | 'grant_desc' | 'popular'>('days_left');

  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Fetch live problem statements & stats from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [psRes, statsRes] = await Promise.all([
          fetch('/api/v1/problem-statements'),
          fetch('/api/v1/problem-statements/stats'),
        ]);

        if (psRes.ok) {
          const psData = await psRes.json();
          if (Array.isArray(psData) && psData.length > 0) {
            setProblemStatements(psData);
          }
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch {
        // Fallback already pre-seeded
      }
    };

    fetchData();
  }, []);

  // Filter and Sort Logic
  const filteredProblems = useMemo(() => {
    let result = [...problemStatements];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (ps) =>
          ps.title.toLowerCase().includes(q) ||
          ps.summary.toLowerCase().includes(q) ||
          ps.sponsor.toLowerCase().includes(q) ||
          ps.tech_stack.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedDomain !== 'All') {
      result = result.filter((ps) => ps.domain.toLowerCase() === selectedDomain.toLowerCase());
    }

    if (selectedCategory !== 'All') {
      result = result.filter((ps) => ps.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (selectedSector !== 'All') {
      result = result.filter((ps) => ps.sector.toLowerCase() === selectedSector.toLowerCase());
    }

    if (selectedUrgency !== 'All') {
      result = result.filter((ps) => ps.urgency.toLowerCase() === selectedUrgency.toLowerCase());
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'days_left') {
        return a.days_left - b.days_left;
      } else if (sortBy === 'grant_desc') {
        return b.grant_amount_num - a.grant_amount_num;
      } else {
        return b.submissions_count - a.submissions_count;
      }
    });

    return result;
  }, [problemStatements, searchQuery, selectedDomain, selectedCategory, selectedSector, selectedUrgency, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDomain('All');
    setSelectedCategory('All');
    setSelectedSector('All');
    setSelectedUrgency('All');
    setSortBy('days_left');
  };

  const scrollToProblems = () => {
    const el = document.getElementById('problem-statements');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTickets = () => {
    const el = document.getElementById('ticket-flow');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen text-[#2B1609] flex flex-col font-sans-modern selection:bg-[#D4AF37]/35 selection:text-[#4A1504]">
      {/* 3D WebGL Golden Dust & Sacred Geometry Mandala Canvas */}
      <ThreeBackground />

      {/* Navigation Bar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenTicketWizard={scrollToTickets}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenGuidelines={() => setShowGuidelines(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <HeroSection
          onExploreClick={scrollToProblems}
          onSubmitClick={scrollToTickets}
        />

        {/* AICTE Domain Insights & Animated Counters */}
        <DomainMetricsSection
          stats={stats}
          selectedDomain={selectedDomain}
          onSelectDomain={setSelectedDomain}
        />

        {/* Problem Statement Provider Module (Squared-Inspired Card Grid) */}
        <section id="problem-statements" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Section Heading & Filter Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-parchment border border-[#D4AF37] mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
                <span className="text-xs font-bold font-cinzel text-[#4A1504] uppercase">
                  Squared Card Motion Architecture
                </span>
              </div>
              <h2 className="font-cinzel text-2xl sm:text-3xl lg:text-4xl font-black text-[#4A1504]">
                Active Problem Statements
              </h2>
              <p className="text-xs sm:text-sm text-[#2B1609]/75 mt-1">
                Explore real-world challenges sponsored by Ministries, Defense establishments, and Industry leaders.
              </p>
            </div>

            {/* Live Count & Reset */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#4A1504] bg-[#FBF4E6] px-3.5 py-1.5 rounded-xl border border-[#D4AF37]/40">
                Showing <strong>{filteredProblems.length}</strong> of {problemStatements.length} Challenges
              </span>
              {(selectedDomain !== 'All' || selectedCategory !== 'All' || selectedSector !== 'All' || selectedUrgency !== 'All' || searchQuery) && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#4A1504] hover:bg-[#4A1504]/10 border border-[#D4AF37]/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Advanced Multi-Parameter Filter Bar */}
          <div className="mb-10 p-5 rounded-2xl glass-parchment-gold border border-[#D4AF37]/60 shadow-lg">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-[#4A1504] font-cinzel">
              <SlidersHorizontal className="w-4 h-4 text-[#C59B27]" />
              <span>Multi-Dimensional Filtering</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Domain Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#4A1504] mb-1">Domain</label>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/90 border border-[#D4AF37]/60 text-[#2B1609] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="All">All Domains</option>
                  <option value="AI/ML">AI / Machine Learning</option>
                  <option value="Smart Education">Smart Education</option>
                  <option value="Cybersecurity">Cybersecurity & PKI</option>
                  <option value="Green Tech">Green Tech & Microgrids</option>
                  <option value="Robotics">Robotics & Drones</option>
                  <option value="Heritage Tech">Heritage Tech & IKS</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#4A1504] mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/90 border border-[#D4AF37]/60 text-[#2B1609] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="All">All Categories</option>
                  <option value="Software">Software Only</option>
                  <option value="Hardware">Hardware Only</option>
                  <option value="Hybrid">Hybrid (Embedded / IoT)</option>
                </select>
              </div>

              {/* Sector Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#4A1504] mb-1">Sector</label>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/90 border border-[#D4AF37]/60 text-[#2B1609] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="All">All Sectors</option>
                  <option value="Government">Government / Defense</option>
                  <option value="Industry">Industry / Corporate</option>
                  <option value="Academic">Academic Research Cells</option>
                </select>
              </div>

              {/* Urgency Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#4A1504] mb-1">Urgency</label>
                <select
                  value={selectedUrgency}
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/90 border border-[#D4AF37]/60 text-[#2B1609] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="All">All Urgency Levels</option>
                  <option value="Critical">Critical Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[11px] font-bold text-[#4A1504] mb-1 flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-[#C59B27]" />
                  <span>Sort By</span>
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/90 border border-[#D4AF37]/60 text-[#2B1609] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="days_left">Expiring Soonest</option>
                  <option value="grant_desc">Highest Grant Amount</option>
                  <option value="popular">Most Competing Teams</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fluid Re-ordering Animated Card Grid */}
          {filteredProblems.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-3xl glass-parchment-gold border border-[#D4AF37]">
              <Search className="w-12 h-12 text-[#C59B27] mx-auto mb-3 opacity-60" />
              <h3 className="font-cinzel text-lg font-bold text-[#4A1504]">
                No matching problem statements found
              </h3>
              <p className="text-xs text-[#2B1609]/70 mt-1 max-w-sm mx-auto">
                Try loosening your filters or search terms to view available national challenges.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 px-5 py-2 rounded-xl text-xs font-bold bg-[#4A1504] text-[#FFF3B0] cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              <AnimatePresence>
                {filteredProblems.map((problem) => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    onSelect={setSelectedProblem}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* Squared-Inspired "Ticket-Flow" Problem Submission Module */}
        <TicketFlowModule />
      </main>

      {/* Interactive Detail Modal */}
      <ProblemModal
        problem={selectedProblem}
        onClose={() => setSelectedProblem(null)}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {/* Guidelines Modal */}
      <GuidelinesModal
        isOpen={showGuidelines}
        onClose={() => setShowGuidelines(false)}
      />

      {/* Antique Manuscript Footer */}
      <Footer />
    </div>
  );
}

export default App;
