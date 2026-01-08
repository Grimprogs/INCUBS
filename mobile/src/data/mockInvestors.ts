// This file contains FAKE investor data for testing
// Startups will see this data in their Explore page

// Define what shape an investor object has
export interface Investor {
  id: string;                    // Unique ID
  name: string;                  // Investor name
  type: 'Angel' | 'VC';         // Type: Individual (Angel) or Firm (VC)
  ticketSize: string;           // Investment range they typically make
  industries: string[];         // Industries they invest in (array of multiple)
  location: string;             // Where they're based
  description: string;          // About them
  avatar: string;               // Profile picture URL
  savedByUser: boolean;         // Has current user saved them?
}

// Array of fake investors
// This is what startups will see in their Explore page
export const mockInvestors: Investor[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    type: 'Angel',                           // Individual investor
    ticketSize: '$50K - $250K',             // Invests 50-250 thousand
    industries: ['AI', 'SaaS', 'FinTech'],  // Multiple industries
    location: 'Silicon Valley, CA',
    description: 'Former Google executive, now angel investor focusing on early-stage tech',
    avatar: 'https://via.placeholder.com/100',
    savedByUser: false,
  },
  {
    id: '2',
    name: 'Vertex Capital',
    type: 'VC',                              // Venture Capital firm
    ticketSize: '$1M - $5M',                // Bigger investments
    industries: ['Clean Energy', 'Climate Tech'],
    location: 'Seattle, WA',
    description: 'Early-stage VC focused on climate and sustainability',
    avatar: 'https://via.placeholder.com/100',
    savedByUser: true,                       // Already saved
  },
  {
    id: '3',
    name: 'Michael Rodriguez',
    type: 'Angel',
    ticketSize: '$100K - $500K',
    industries: ['HealthTech', 'BioTech'],
    location: 'Boston, MA',
    description: 'Doctor turned investor, passionate about healthcare innovation',
    avatar: 'https://via.placeholder.com/100',
    savedByUser: false,
  },
  {
    id: '4',
    name: 'Innovation Ventures',
    type: 'VC',
    ticketSize: '$2M - $10M',
    industries: ['EdTech', 'AI', 'SaaS'],
    location: 'New York, NY',
    description: 'Series A and B focused VC with portfolio of 30+ companies',
    avatar: 'https://via.placeholder.com/100',
    savedByUser: false,
  },
];
