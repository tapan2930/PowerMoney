const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Add support for importing .sql files (needed for Drizzle migrations)
config.resolver.sourceExts.push('sql');

module.exports = config;
