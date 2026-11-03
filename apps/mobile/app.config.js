module.exports = ({ config }) => {
  const baseUrl = process.env.WRECKADAY_WEB_BASE_URL;
  return {
    ...config,
    ...(baseUrl ? { experiments: { ...config.experiments, baseUrl } } : {}),
  };
};
