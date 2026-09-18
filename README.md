# Land Advisor

A mobile app (React Native + Expo) that gives directional, reasoned advice on
what to grow, farm, or build on a piece of land — based on location data
(climate, elevation, soil) plus a few user-provided answers.

Advice is always framed as directional suggestions with caveats, never as a
guarantee — especially where the underlying data is estimated rather than
user-confirmed.

## Project structure

```
mobile/   Expo (React Native + TypeScript) app — iOS/Android/web from one codebase
server/   Node/Express (TypeScript) backend — fetches climate/elevation/soil
          data and calls the LLM reasoning layer
```

## Getting started

### Backend

```
cd server
cp .env.example .env
npm install
npm run dev
```

Server runs on http://localhost:4000. Try:

```
GET http://localhost:4000/api/environment?lat=13.7563&lng=100.5018
```

### Mobile app

```
cd mobile
npm install
npm start
```

## Status

- [x] Backend route: climate + elevation lookup by lat/lng
- [x] Backend: soil pH/type estimate (ISRIC SoilGrids)
- [ ] Backend: LLM reasoning route (structured data + user answers -> suggestions)
- [ ] Mobile: pin-drop / location input screen
- [ ] Mobile: follow-up questions form
- [ ] Mobile: results screen with tiered suggestions
