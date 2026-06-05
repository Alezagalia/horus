// Skip @testing-library/react-native peer-deps version check
// (react-test-renderer is hoisted from the web workspace with a different React version)
process.env.RNTL_SKIP_DEPS_CHECK = 'true';
