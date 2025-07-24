# Create scripts/config.js
cat > scripts/config.js << 'EOF'
module.exports = {
  CONFIG: {
    PAGE: {
      NAMES_PER_PAGE: 50,
      DEFAULT_START_PAGE: 1,
      PAGE_NUMBER_PREFIX: 'Page',
    }
  },
  PageHelpers: {
    getPageTitle: (pageNumber) => {
      return `Page ${pageNumber}`;
    },
    calculateTotalPages: (totalNames) => {
      return Math.ceil(totalNames / 50);
    }
  }
};
EOF