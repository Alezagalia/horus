// Redirect to the actual App in apps/mobile
// This file exists because expo/AppEntry.js looks for ../../App
// which from node_modules/expo/ points to the monorepo root
export { default } from './apps/mobile/App';
