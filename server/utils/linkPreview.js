const { getLinkPreview } = require('link-preview-js');

const extractLinks = (content) => {
  const urlRegex = /https?:\/\/[^\s"'<>]+/g;
  return content.match(urlRegex) || [];
};

const getFirstLinkPreview = async (content) => {
  try {
    const links = extractLinks(content);
    if (links.length === 0) return null;

    const cleanUrl = links[0].replace(/['"]+$/, '');

    const preview = await getLinkPreview(cleanUrl, {
      timeout: 3000,
      headers: {
        'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      },
    });

    return {
      url: preview.url,
      title: preview.title,
      description: preview.description,
      image: preview.images?.[0] || null,
      siteName: preview.siteName,
    };
  } catch (error) {
    console.error('Error getting link preview:', error);
    return null;
  }
};

module.exports = { getFirstLinkPreview }; 