// This file contains FAKE fundraising campaign posts
// These are what investors will see in their Feed (like Tinder cards)

// Define what a campaign post looks like
export interface Campaign {
  id: string;                 // Unique ID
  startupId: string;          // Which startup posted this
  startupName: string;        // Name of the startup
  title: string;              // Campaign headline
  description: string;        // What they're raising for
  fundingGoal: string;        // Total amount they want to raise
  currentRaised: string;      // How much they've raised so far
  industry: string;           // Their industry
  stage: string;              // Company stage
  image: string;              // Campaign image/banner
  createdAt: string;          // When was this posted
  stats: {                    // Statistics about the campaign
    views: number;            // How many people viewed it
    interests: number;        // How many swiped right (interested)
    matches: number;          // How many mutual matches
  };
}

// Array of fake campaigns
// Investors swipe through these in Feed
export const mockCampaigns: Campaign[] = [
  {
    id: 'c1',
    startupId: '1',
    startupName: 'TechFlow AI',
    title: 'Revolutionizing Business Automation with AI',
    description: 'We\'re building AI that helps small businesses automate repetitive tasks. Already have 500 paying customers and growing 20% monthly. Raising to scale our sales team and expand to Europe.',
    fundingGoal: '$500K',
    currentRaised: '$150K',              // Already raised 150K
    industry: 'AI',
    stage: 'Seed',
    image: 'https://via.placeholder.com/400x300',
    createdAt: '2 days ago',
    stats: {
      views: 1250,                       // 1,250 people viewed this
      interests: 89,                     // 89 people swiped right
      matches: 12,                       // 12 mutual matches
    },
  },
  {
    id: 'c2',
    startupId: '2',
    startupName: 'GreenEnergy Solutions',
    title: 'Making Solar Energy Accessible to Everyone',
    description: 'Solar installation platform that reduces costs by 40%. Completed 200 installations in Texas. Expanding to 3 new states and need funding for inventory and marketing.',
    fundingGoal: '$2M',
    currentRaised: '$800K',
    industry: 'Clean Energy',
    stage: 'Series A',
    image: 'https://via.placeholder.com/400x300',
    createdAt: '1 week ago',
    stats: {
      views: 3400,
      interests: 234,
      matches: 45,
    },
  },
  {
    id: 'c3',
    startupId: '3',
    startupName: 'HealthTrack Pro',
    title: 'AI-Powered Health Monitoring in Your Pocket',
    description: 'Our app uses phone sensors and AI to detect early signs of health issues. Partnership with 3 major hospitals. Raising for FDA approval process and user acquisition.',
    fundingGoal: '$250K',
    currentRaised: '$0',                 // Just started
    industry: 'HealthTech',
    stage: 'Pre-seed',
    image: 'https://via.placeholder.com/400x300',
    createdAt: '3 days ago',
    stats: {
      views: 890,
      interests: 67,
      matches: 8,
    },
  },
];

// If user is a STARTUP, they only see their own campaigns
// This function filters campaigns to show only theirs
export const getCampaignsForStartup = (startupId: string): Campaign[] => {
  // Filter means "only keep items that match this condition"
  // In this case: only keep campaigns where the startupId matches
  return mockCampaigns.filter(campaign => campaign.startupId === startupId);
};
