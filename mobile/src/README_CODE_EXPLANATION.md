# INCUBES App - Complete Code Explanation

## 📁 Project Structure

```
src/
├── data/                    # Mock data files
│   ├── mockStartups.ts     # Fake startup profiles
│   ├── mockInvestors.ts    # Fake investor profiles
│   └── mockCampaigns.ts    # Fake fundraising campaigns
│
└── screens/                 # All app screens
    ├── Dashboard.tsx        # Main screen with bottom tabs
    ├── ExploreScreen.tsx    # Discovery page (browse profiles)
    ├── FeedScreen.tsx       # Engagement page (swipe/analytics)
    ├── SavedScreen.tsx      # Saved items (placeholder)
    └── ProfileScreen.tsx    # User profile (placeholder)
```

---

## 🎯 How the App Works

### 1. **TWO USER ROLES**
- **INVESTOR**: Browse startups, swipe through campaigns
- **STARTUP**: Browse investors, manage campaigns

### 2. **FOUR MAIN TABS**
- **Explore**: Discovery (no posting, just browsing)
- **Feed**: Engagement (swiping or analytics)
- **Saved**: Bookmarked items
- **Profile**: User settings

---

## 📊 Data Flow Explained

### Mock Data Files (src/data/)

These files contain FAKE data for testing. Later, you'll replace this with real database calls.

**mockStartups.ts**
- Array of startup companies
- Used by: Investors in Explore screen

**mockInvestors.ts**
- Array of investors
- Used by: Startups in Explore screen

**mockCampaigns.ts**
- Array of fundraising campaigns
- Used by: Investors in Feed (swipe cards)
- Used by: Startups in Feed (their own campaigns)

---

## 🔄 Role-Based Rendering

### The Key Concept:
```typescript
{userRole === 'investor' ? (
  <ShowStartups />
) : (
  <ShowInvestors />
)}
```

This is called **conditional rendering**. It means:
- IF user is investor → show startups
- OTHERWISE (user is startup) → show investors

### Where It Happens:

**Explore Screen:**
```typescript
{userRole === 'investor' && (
  // Show startup cards
)}

{userRole === 'startup' && (
  // Show investor cards
)}
```

**Feed Screen:**
```typescript
{userRole === 'investor' ? (
  // Swipeable campaign cards
) : (
  // Own campaigns + analytics
)}
```

---

## 💫 Swipe Logic Explained

### How Swiping Works (Step by Step)

**1. Track Card Position**
```typescript
const position = useRef(new Animated.ValueXY()).current;
```
- This creates a variable that tracks X (left/right) and Y (up/down)
- Starts at {x: 0, y: 0} (center of screen)

**2. Listen to Touch Movements**
```typescript
PanResponder.create({
  onPanResponderMove: (event, gesture) => {
    position.setValue({ x: gesture.dx, y: gesture.dy });
  }
})
```
- `onPanResponderMove` runs continuously as finger moves
- `gesture.dx` = how far finger moved horizontally
- `gesture.dy` = how far finger moved vertically
- Updates card position to follow finger

**3. Detect Swipe Direction**
```typescript
onPanResponderRelease: (event, gesture) => {
  if (gesture.dx > SWIPE_THRESHOLD) {
    forceSwipe('right');  // Swiped far enough right
  } else if (gesture.dx < -SWIPE_THRESHOLD) {
    forceSwipe('left');   // Swiped far enough left
  } else {
    resetPosition();      // Didn't swipe far enough
  }
}
```
- `onPanResponderRelease` runs when finger lifts
- `SWIPE_THRESHOLD` = 25% of screen width
- Checks if swipe was far enough to count

**4. Animate Card Off Screen**
```typescript
Animated.timing(position, {
  toValue: { x: SCREEN_WIDTH + 100, y: 0 },
  duration: 250,
}).start(() => {
  // After animation completes
  onSwipeComplete('right');
});
```
- Smoothly moves card off screen (250ms)
- After animation ends, handle the swipe action

**5. Move to Next Card**
```typescript
setCurrentIndex(currentIndex + 1);
```
- Increases index by 1
- Shows next campaign card

### Visual Feedback

**Rotation While Dragging:**
```typescript
const rotate = position.x.interpolate({
  inputRange: [-SCREEN_WIDTH/2, 0, SCREEN_WIDTH/2],
  outputRange: ['-10deg', '0deg', '10deg'],
});
```
- When dragged left → tilts left (-10°)
- When centered → straight (0°)
- When dragged right → tilts right (10°)

**"LIKE" and "NOPE" Labels:**
```typescript
const likeOpacity = position.x.interpolate({
  inputRange: [-SCREEN_WIDTH/2, 0, SCREEN_WIDTH/2],
  outputRange: [0, 0, 1],  // Only visible when swiping right
});
```
- Fades in as you swipe
- LIKE = appears when swiping right
- NOPE = appears when swiping left

---

## 🎨 UI Components Explained

### Card Component (Explore)
Instagram-style cards with:
- Logo/avatar at top
- Name and industry
- Description
- Info badges (stage, funding, etc.)
- Location
- Two buttons: "View Profile" and "Save"

### Swipe Card (Feed - Investor View)
Tinder-style cards with:
- Large campaign image
- Overlay with campaign info
- Gesture handlers for swiping
- LIKE/NOPE labels that appear
- "View Full Details" button

### Campaign Card (Feed - Startup View)
LinkedIn-style cards with:
- Campaign image
- Title and date
- Analytics row (Views, Interests, Matches)
- Progress bar (funding raised)
- "View Details" button

---

## 🧩 Component Hierarchy

```
Dashboard
├── Bottom Tab Bar
│   ├── Explore Tab
│   ├── Feed Tab
│   ├── Saved Tab
│   └── Profile Tab
│
└── Screen Container
    │
    ├── ExploreScreen (if Explore tab active)
    │   ├── Header
    │   └── ScrollView
    │       └── [Startup Cards] OR [Investor Cards]
    │
    ├── FeedScreen (if Feed tab active)
    │   ├── Header
    │   └── [Swipe Container] OR [Campaign List]
    │       ├── Stack of Cards (Investor)
    │       └── Campaign Cards with Analytics (Startup)
    │
    ├── SavedScreen (if Saved tab active)
    └── ProfileScreen (if Profile tab active)
```

---

## 🔧 Key React Concepts Used

### 1. **useState Hook**
```typescript
const [activeTab, setActiveTab] = useState('Explore');
```
- Creates a variable that can change
- When it changes, component re-renders
- `activeTab` = current value
- `setActiveTab` = function to update it

### 2. **useRef Hook**
```typescript
const position = useRef(new Animated.ValueXY()).current;
```
- Creates a value that persists between renders
- Doesn't cause re-render when changed
- Used for animations and PanResponder

### 3. **Conditional Rendering**
```typescript
{condition && <Component />}
{condition ? <ComponentA /> : <ComponentB />}
```
- Show different things based on conditions
- Used for role-based content

### 4. **Map Function**
```typescript
{mockStartups.map(startup => (
  <StartupCard key={startup.id} data={startup} />
))}
```
- Loops through an array
- Renders a component for each item
- Like a for-loop but returns JSX

### 5. **Props**
```typescript
interface ExploreScreenProps {
  userRole: 'investor' | 'startup';
}
```
- Data passed from parent to child component
- Like function parameters

---

## 🎬 User Journey

### Investor Journey:
1. **Login** → Set role = 'investor'
2. **Dashboard** → See bottom tabs
3. **Explore Tab** → Browse startup cards, save interesting ones
4. **Feed Tab** → Swipe through campaign cards
   - Swipe Right = Interested
   - Swipe Left = Pass
5. **Saved Tab** → See saved startups
6. **Profile Tab** → View/edit own investor profile

### Startup Journey:
1. **Login** → Set role = 'startup'
2. **Dashboard** → See bottom tabs
3. **Explore Tab** → Browse investor cards, save potential investors
4. **Feed Tab** → See own campaigns with analytics
   - Views, Interests, Matches
   - Create new campaigns
5. **Saved Tab** → See saved investors
6. **Profile Tab** → View/edit own startup profile

---

## 📝 What Happens Where

| Screen | Investor Sees | Startup Sees |
|--------|--------------|--------------|
| **Explore** | Startup profiles to browse | Investor profiles to browse |
| **Feed** | Campaign cards to SWIPE | Own campaigns + ANALYTICS |
| **Saved** | Saved startups | Saved investors |
| **Profile** | Own investor profile | Own startup profile |

---

## 🚀 How to Use These Files

**In your main App.tsx:**
```typescript
import Dashboard from './src/screens/Dashboard';

function App() {
  // After user logs in, you know their role
  const userRole = 'investor';  // or 'startup'
  const userId = 'user123';

  return <Dashboard userRole={userRole} userId={userId} />;
}
```

---

## 🔮 What's Missing (To Do Later)

1. **Real Database Connection**
   - Replace mock data with API calls
   - Supabase/Firebase integration

2. **Authentication**
   - Login/Signup screens
   - Get user role from database

3. **Profile Details Page**
   - When clicking "View Profile"
   - Navigate to full profile screen

4. **Save Functionality**
   - Actually save to database
   - Persist across sessions

5. **Swipe Persistence**
   - Save swipe actions to database
   - Track matches

6. **Campaign Creation**
   - Form to create new campaigns
   - Image upload

7. **Real Analytics**
   - Track real views/interests
   - Update in real-time

---

## 💡 Key Takeaways

1. **Role determines everything** - One variable (`userRole`) changes the entire app experience
2. **Swipe = Math** - Track position, detect threshold, animate
3. **Conditional rendering** - Show different UI based on conditions
4. **Mock data first** - Build UI with fake data, connect real data later
5. **Component reuse** - Same Dashboard for both roles, just different content

---

## ❓ Common Questions

**Q: How does the app know if user is investor or startup?**
A: When user logs in, we get their role from database and pass it down as a prop to all components.

**Q: Why mock data instead of real database?**
A: Building UI first lets you see and test everything without backend complexity. Once UI works, connecting to database is just changing data source.

**Q: How does swiping actually work?**
A: PanResponder tracks your finger → Updates card position → When you lift finger, checks how far you moved → If far enough, animates card off screen → Shows next card.

**Q: What's the difference between Explore and Feed?**
A: Explore = DISCOVERY (browse profiles, static cards). Feed = ENGAGEMENT (take actions, swipe/analyze).

---

Made with ❤️ for learning React Native
