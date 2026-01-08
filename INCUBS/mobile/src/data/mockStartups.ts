// This file contains FAKE startup data for testing
// In the future, this data will come from a real database

// Define what shape a startup object has (like a blueprint)
export interface Startup {
  id: string;              // Unique ID for each startup
  name: string;            // Company name
  industry: string;        // What business they're in
  stage: string;           // How mature the company is
  fundingNeeded: string;   // How much money they need
  location: string;        // Where they're based
  description: string;     // What the company does
  logo: string;           // Company logo URL (placeholder for now)
  savedByUser: boolean;   // Has the current user saved this?
}

// Array of fake startup companies
// This is what investors will see in their Explore page
export const mockStartups: Startup[] = [
  {
    id: '1',
    name: 'TechFlow AI',
    industry: 'Artificial Intelligence',
    stage: 'Seed',                    // Early stage company
    fundingNeeded: '$500K',           // Half a million dollars needed
    location: 'San Francisco, CA',
    description: 'AI-powered workflow automation for small businesses',
    logo: 'https://via.placeholder.com/100', // Placeholder image
    savedByUser: false,               // Not saved yet
  },
  {
    id: '2',
    name: 'GreenEnergy Solutions',
    industry: 'Clean Energy',
    stage: 'Series A',                // More mature than seed
    fundingNeeded: '$2M',             // 2 million dollars needed
    location: 'Austin, TX',
    description: 'Solar panel installation and maintenance platform',
    logo: 'https://via.placeholder.com/100',
    savedByUser: false,
  },
  {
    id: '3',
    name: 'HealthTrack Pro',
    industry: 'HealthTech',
    stage: 'Pre-seed',                // Very early stage
    fundingNeeded: '$250K',
    location: 'New York, NY',
    description: 'Personal health monitoring app with AI diagnostics',
    logo: 'https://via.placeholder.com/100',
    savedByUser: true,                // This one is already saved
  },
  {
    id: '4',
    name: 'EduLearn Platform',
    industry: 'EdTech',
    stage: 'Seed',
    fundingNeeded: '$750K',
    location: 'Boston, MA',
    description: 'Interactive learning platform for STEM education',
    logo: 'https://via.placeholder.com/100',
    savedByUser: false,
  },
];
