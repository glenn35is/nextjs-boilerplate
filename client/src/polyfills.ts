// Polyfills for blockchain libraries in browser environment
import { Buffer } from 'buffer';
import process from 'process';

// Make Buffer globally available
(window as any).global = window;
(window as any).Buffer = Buffer;
(window as any).process = process;

// Set up proper environment variables
if (!process.env) {
  process.env = {};
}

// Ensure NODE_ENV is set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

export {};
