# Xandeum pNodes Analytics

Real-time monitoring dashboard for Xandeum pNodes - the decentralized storage layer for Solana.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Real-time Monitoring** - Live pNode status updates every 30 seconds
- **Network Analytics** - Health scores, uptime metrics, storage utilization
- **Interactive Map** - Global pNode distribution with country-level insights
- **STOINC Insights** - Storage income distribution and boost factor information
- **Performance Metrics** - Gauge visualization, health tiers, version tracking
- **Storage Pressure Alerts** - Identify nodes approaching capacity limits

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Maps**: Leaflet / OpenStreetMap (no API key required)
- **Data**: xandeum-prpc (gossip network)
- **Charts**: Recharts

## Deployment

### Vercel (Recommended)

1. Fork or clone this repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Click **Deploy**

No environment variables required - the app works out of the box.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cryptobeijing/pNodes)

### Other Platforms

```bash
# Build for production
npm run build

# Start production server
npm start
```

The app runs on port 3000 by default.

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── pnodes/        # pNode data endpoints
│   │   └── analytics/     # Analytics endpoints
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── AnalyticsTab.tsx   # Analytics section
│   ├── PNodesTable.tsx    # pNodes list (card view)
│   ├── CountryMap.tsx     # World map visualization
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
│   └── usePNodes.ts       # Data fetching hook
├── server/                # Backend services
│   ├── services/          # Business logic
│   └── types/             # TypeScript types
└── lib/                   # Utilities
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/pnodes` | List all pNodes |
| `GET /api/pnodes/:pubkey` | Single pNode details |
| `GET /api/analytics/summary` | Network statistics |
| `GET /api/analytics/extended-summary` | Health scores, uptime |
| `GET /api/analytics/node-metrics` | Per-node metrics |
| `GET /api/analytics/country-choropleth` | Geographic distribution |

## Dashboard Tabs

### Overview
- Live network pulse visualization
- Activity feed
- Node status distribution (online/offline)
- Health tier breakdown
- Global pNodes distribution map

### pNodes
- Searchable card-based pNode directory
- Health scores, storage usage, region info
- Click any card for detailed node information

### Analytics
- Network capacity metrics
- Performance gauge with health score
- STOINC (Storage Income) insights
- Storage pressure monitoring
- Version and region distribution

## About Xandeum

Xandeum extends Solana with decentralized storage through pNodes. Key concepts:

- **pNodes**: Storage units that provide disk space to the network
- **STOINC**: Storage Income - 94% goes to pNode operators, 6% to development
- **Performance Score**: 0-1 based on uptime and response rate
- **Boost Factors**: NFT multipliers (Titan up to 11x, Deep South 16x base)

Learn more at [xandeum.network](https://www.xandeum.network)

## License

MIT
