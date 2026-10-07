export const channels = [
  { id: "home", label: "Home", key: "H" }, { id: "about", label: "About", key: "A" },
  { id: "projects", label: "Projects", key: "P" }, { id: "experience", label: "Experience", key: "E" },
  { id: "skills", label: "Skills", key: "S" }, { id: "awards", label: "Awards", key: "W" },
  { id: "contact", label: "Contact", key: "C" },
  { id: "music", label: "Music", key: "N" },
] as const;
export type Channel = typeof channels[number]["id"];
// Sources: ayerkhali.vercel.app and the owner's supplied project brief.
// Unverified dates, metrics, private URLs, and unsupported technologies are omitted.
export const profile = {
  name: "Ayer Khali Abrio", nickname: "Yeng", role: "Full Stack Developer",
  location: "Puerto Princesa City, Palawan", country: "Philippines",
  email: "ayerkhalidesu@gmail.com", github: "https://github.com/ayerkhalix",
  linkedin: "https://www.linkedin.com/in/ayer-khali-abrio-a71364362/",
  instagram: "https://www.instagram.com/ayerkundesu/",
  resume: null as string | null, // The original /resume.pdf returns 404. Add a valid local PDF here.
  about: "I'm Ayer, but you can call me Yeng. I'm a BSIT graduate from Palawan who builds web applications and software that people can actually use. My work spans internal company tools, client websites, and a thesis that brought machine learning onto a mobile device.",
  approach: "I like understanding the problem before writing the code. Then I work through the interface, the data, and the details that make a system reliable. I'm looking for opportunities to keep building and learning with a good team.",
};
export type Project = {
  id: string; name: string; shortName: string; category: string; role: string;
  summary: string; description: string; highlights: string[]; stack: string[];
  image?: string; github?: string; live?: string; accent: string;
};
export const projects: Project[] = [
  {
    id: "mgen", name: "MGEN Central Hub", shortName: "Central Hub", category: "PROFESSIONAL · INTERNAL PLATFORM",
    role: "Developer / contributor & maintainer", accent: "blue", image: "/images/mgen.webp",
    summary: "One central place for the tools that keep a company moving.",
    description: "An internal company platform at Microgenesis Business Systems. I contributed to development and continued maintenance of employee, admin, and client workflows, with secure access across company tools.",
    highlights: ["Microsoft SSO and role-based access", "AI employee assistant using the Gemini API", "Next.js frontend, Django REST APIs, and Supabase/PostgreSQL", "Deployment workflows and ongoing production maintenance"],
    stack: ["Next.js", "Django REST", "Supabase", "PostgreSQL", "Gemini API"],
  },
  {
    id: "caulerid", name: "CaulerID", shortName: "CaulerID", category: "THESIS · ON-DEVICE MACHINE LEARNING",
    role: "Thesis developer / model training & integration", accent: "green", image: "/images/caulerid.webp",
    summary: "Identifying sea grapes. On a phone. Even offline.",
    description: "A mobile application for identifying Caulerpa species and classifying sea grape freshness from photos. I trained the machine learning model and integrated it into the app for local, on-device inference.",
    highlights: ["Trained MobileNetV3Small using a Caulerpa image dataset", "TensorFlow Lite inference on the mobile device", "Offline-first identification and freshness classification", "React Native / Expo with Supabase synchronization"],
    stack: ["React Native", "Expo", "Python", "TensorFlow Lite", "Supabase"],
    github: "https://github.com/ayerkhalix/cauler-id", live: "https://cauler-id-web-app.vercel.app/",
  },
  {
    id: "food-n-bev", name: "Food N Bev N Beyond", shortName: "Food N Bev", category: "FREELANCE · CLIENT SYSTEM",
    role: "Freelance developer", accent: "amber",
    summary: "Restaurant brands, connected through one digital home.",
    description: "A restaurant website system built around client requirements, with a multi-brand structure, QR-accessible restaurant pages, menus, and restaurant information.",
    highlights: ["Client requirements gathering and system design", "Frontend development for multiple restaurant brands", "QR-accessible pages and digital menus", "Centralized dashboard for managing the restaurant presence"],
    stack: ["Frontend development", "System design", "Client collaboration"],
  },
  {
    id: "trinitysync", name: "TrinitySync", shortName: "TrinitySync", category: "WEB APPLICATION · SCHEDULING",
    role: "Full-stack developer", accent: "purple", image: "/images/trinitysync.webp",
    summary: "Less scheduling friction. More clarity for everyone.",
    description: "A centralized scheduling system that lets departments assign subjects without time or room conflicts and gives students a clear, unified view of their schedules.",
    highlights: ["Time and room conflict detection", "Role-based access for different users", "Unified student schedules", "Real-time schedule updates"],
    stack: ["Next.js", "Django", "Node.js"], github: "https://github.com/ayerkhalix/trinity-sync",
  },
  {
    id: "floppyhous", name: "FloppyHous", shortName: "FloppyHous", category: "CLIENT WEBSITE · EVENTS & CULTURE",
    role: "Web developer", accent: "purple", image: "/images/floppyhous.webp",
    summary: "A digital stage for events, music, and community.",
    description: "A marketing and event showcase website with dynamic event pages, filters for upcoming and previous events, countdowns, and smooth interactions across desktop and mobile.",
    highlights: ["Dynamic event routes", "Upcoming and previous event filters", "Event countdown experiences", "Responsive design and interaction animations"],
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion"],
    github: "https://github.com/ayerkhalix/floppyhous-website-showcase", live: "https://floppyhous-website-showcase-zjym.vercel.app/",
  },
  {
    id: "bloom", name: "Bloom For You", shortName: "Bloom For You", category: "PERSONAL · A SMALL INTERNET GIFT",
    role: "Developer", accent: "rose", image: "/images/bloom.webp",
    summary: "A cozy little place to send flowers and a kind message.",
    description: "A web app made for sharing flowers and sweet messages online, with a focus on a warm visual experience and thoughtful interaction.",
    highlights: ["Digital flowers and personal messages", "Responsive interface", "Small, considered animations"],
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
    github: "https://github.com/ayerkhalix/bloom-for-you", live: "https://bloom-for-you-ayerkhalidesu-4298s-projects.vercel.app/",
  },
];
export const experience = [
  { kind: "INTERNSHIP & DEVELOPMENT", company: "Microgenesis Business Systems", role: "IT / Digital Innovation Group", text: "Contributed to internal software, including MGEN Central Hub. Worked on authentication, application features, deployment workflows, and ongoing maintenance." },
  { kind: "CLIENT WORK", company: "Freelance Software Development", role: "Web applications & restaurant systems", text: "Turned client requirements into websites and working systems, including Food N Bev N Beyond and the FloppyHous event showcase." },
  { kind: "THESIS & PROJECT WORK", company: "From research to working software", role: "BSIT graduate · mobile, web & machine learning", text: "Trained and integrated CaulerID's image classification model, built scheduling tools, and worked with a team on the Layag startup concept." },
];
export const skills = [
  { name: "FRONTEND", items: ["React", "Next.js", "TypeScript", "JavaScript", "HTML / CSS", "Tailwind CSS", "Framer Motion"] },
  { name: "BACKEND", items: ["Node.js", "Python", "Django", "Django REST Framework", "REST APIs"] },
  { name: "DATA & AUTH", items: ["PostgreSQL", "Supabase", "Microsoft SSO", "Role-based access"] },
  { name: "AI / ML", items: ["TensorFlow", "TensorFlow Lite", "MobileNetV3Small", "Gemini API"] },
  { name: "MOBILE & WORKFLOW", items: ["React Native", "Expo", "Git / GitHub", "Vercel", "Deployment workflows"] },
];
export const awards = [
  { title: "MIMAROPA Startup / Hackathon", distinction: "Champion", project: "Layag", role: "Team Lead", text: "Led the team behind Layag, a startup concept developed for the MIMAROPA startup / hackathon competition." },
  { title: "St. Vincent Ferrer Medal", distinction: "Best in OJT", project: "Internship recognition", role: "BSIT", text: "Recognition for my work and performance during on-the-job training." },
];
