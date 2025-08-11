# Overview

Chain Reaction Game is a strategic multiplayer board game built with React and TypeScript. The game features two distinct modes: Classic Mode (traditional chain reaction gameplay) and Base Reaction Mode (with headquarters and power-ups). Players take turns placing dots on a grid, and when cells reach critical mass, they explode and spread to adjacent cells, potentially creating chain reactions. The game supports both human and AI players with multiple difficulty levels.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: React Router for navigation between game modes and menu screens
- **State Management**: Zustand for global state management with separate stores for game logic, audio, and general game state
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **Animation**: Framer Motion for smooth transitions and game animations
- **UI Components**: Radix UI primitives for accessible component foundation with custom styling

## Game Logic Architecture
- **Core Game Store**: `useChainReaction` manages grid state, player turns, win conditions, and game history
- **AI System**: Aggressive strategic AI with three difficulty levels (easy, medium, hard) focusing on:
  - Power-up acquisition and strategic positioning
  - Aggressive expansion and enemy territory capture
  - Smart base defense when under attack
  - Chain reaction maximization for massive damage
  - Enemy base targeting for decisive victories
- **Game Modes**: 
  - Classic Mode: Traditional chain reaction rules
  - Base Reaction Mode: Enhanced with headquarters (HQ) system and power-ups
- **Animation System**: Centralized animation state management with precise timing control
- **Audio System**: Dedicated audio store for sound effects and background music management

## Component Structure
- **Game Components**: Modular game board, cells, controls, and overlay components
- **Menu System**: Main menu with player configuration, AI settings, and tutorial screens
- **Responsive Design**: Mobile-first approach with touch-friendly interactions

## State Management Pattern
- **Zustand Stores**: Multiple focused stores instead of single monolithic state
- **Immutable Updates**: State updates follow immutable patterns for predictable behavior
- **Local Storage**: Player preferences and settings persistence
- **History System**: Undo functionality with complete game state snapshots

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18, React Router for SPA navigation
- **Build Tools**: Vite for development and production builds with TypeScript support
- **State Management**: Zustand for lightweight, scalable state management

## UI and Styling
- **Styling**: Tailwind CSS for utility-first styling with custom configuration
- **Component Library**: Extensive Radix UI component suite for accessible primitives
- **Animation**: Framer Motion for performant animations and transitions
- **Icons**: Radix UI icons and custom icon implementations

## Database and Backend
- **Database ORM**: Drizzle ORM with PostgreSQL support via Neon Database serverless driver
- **Schema Validation**: Zod for runtime type validation and schema definition
- **Backend Framework**: Express.js server setup (minimal implementation)

## Development Tools
- **TypeScript**: Full TypeScript implementation with strict configuration
- **Development**: Replit-specific plugins for development environment integration
- **Code Quality**: ESLint and TypeScript compiler checks

## Deployment
- **Static Hosting**: GitHub Pages deployment configuration
- **Build Process**: Vite production builds with asset optimization