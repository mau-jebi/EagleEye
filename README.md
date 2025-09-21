# 🦅 EagleEye Assignment Tracker PWA

A mobile-first Progressive Web Application for students to track assignments and deadlines. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🔥 Core Features
- **Mobile-First Design**: Optimized for smartphones with responsive desktop support
- **Progressive Web App**: Installable on mobile devices with offline capabilities
- **Assignment Management**: Create, edit, delete, and track assignment progress
- **Smart Filtering**: Filter by class, status, priority, and smart lists (Today, Overdue, Quick Wins)
- **Multiple Views**: Dashboard, List, Kanban, Calendar, and Priority Matrix views
- **Data Persistence**: Local storage keeps your data safe across sessions

### 📱 Mobile Optimizations
- **Touch-Friendly Interface**: Large touch targets and intuitive gestures
- **Responsive Layout**: Adapts perfectly from mobile to desktop
- **Mobile Sidebar**: Slide-out navigation for easy access
- **Optimized Forms**: Mobile-friendly form inputs and modals
- **Fast Loading**: Optimized performance for mobile networks

### 🎯 Assignment Features
- **Priority System**: Mark assignments as important/urgent with visual indicators
- **Status Tracking**: Not Started, In Progress, Almost Done, Completed, Overdue
- **Smart Due Dates**: Automatic overdue detection and highlighting
- **Class Organization**: Color-coded classes for easy identification
- **Time Estimation**: Track estimated completion time for better planning

### 🏫 Default Classes
Pre-configured with common high school classes:
- English (Blue)
- History (Green)
- Calculus (Orange)
- TOK (Purple)
- Personal (Gray)
- Yearbook (Pink)
- Psychology (Cyan)
- Biology (Lime)
- Spanish (Orange)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   ```
   http://localhost:3000
   ```

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## PWA Installation

### On Mobile (iOS/Android)
1. Open the app in your mobile browser
2. Look for "Add to Home Screen" option
3. Follow the prompts to install

### On Desktop
1. Open the app in Chrome, Edge, or Safari
2. Look for the install icon in the address bar
3. Click to install as a desktop app

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PWA**: next-pwa
- **Icons**: Lucide React
- **Data**: localStorage for persistence
- **Deployment**: Vercel-ready

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── layout.tsx       # Root layout with PWA meta tags
│   └── page.tsx         # Home page
├── components/          # React components
│   └── EagleEyeApp.tsx  # Main application component
├── hooks/              # Custom React hooks
│   └── useLocalStorage.ts
├── types/              # TypeScript type definitions
│   └── index.ts
public/
├── manifest.json       # PWA manifest
├── icon-*.png         # PWA icons (placeholders)
└── favicon.ico        # Favicon
```

## Features in Detail

### Smart Lists
- **Today**: Assignments due today
- **Overdue**: Past due assignments
- **Important**: High priority assignments
- **Urgent**: Time-sensitive assignments
- **Do Now**: Important AND urgent assignments due soon
- **Quick Wins**: Tasks 30 minutes or less

### Mobile Interactions
- **Touch Gestures**: Native mobile interactions
- **Haptic Feedback**: Vibration on supported devices
- **Pull-to-Refresh**: Standard mobile patterns
- **Optimized Scrolling**: Smooth performance

### Data Management
- **Auto-save**: Changes saved automatically to localStorage
- **Offline Support**: Works without internet connection
- **Data Export**: Browser-based data persistence
- **Sync Ready**: Architecture supports future cloud sync

## Browser Support

- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Desktop**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **PWA**: All modern browsers with PWA support

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Adding New Features

1. **Components**: Add to `src/components/`
2. **Types**: Update `src/types/index.ts`
3. **Hooks**: Add to `src/hooks/`
4. **Styling**: Use Tailwind classes

### PWA Configuration

The PWA is configured in:
- `next.config.js` - next-pwa setup
- `public/manifest.json` - App manifest
- `src/app/layout.tsx` - Meta tags and icons

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

**Keep an eagle eye on your assignments!** 🦅
