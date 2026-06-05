const React = require('react');

// Lazy-load View to avoid initialization order issues in Jest
const LinearGradient = ({ children, ...props }) => {
  const { View } = require('react-native');
  return React.createElement(View, props, children);
};

module.exports = { LinearGradient };
