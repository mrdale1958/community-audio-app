module.exports = {
  CONFIG: {
    PAGE: {
      NAMES_PER_PAGE: 44,
      DEFAULT_START_PAGE: 1,
      PAGE_NUMBER_PREFIX: 'Page',
    }
  },
  PageHelpers: {
    getPageTitle: (pageNumber) => {
      return `Page ${pageNumber}`;
    },
    calculateTotalPages: (totalNames) => {
      const CONFIG = module.exports.CONFIG; // Reference the config
      return Math.ceil(totalNames / CONFIG.PAGE.NAMES_PER_PAGE);
    }
  }
};
