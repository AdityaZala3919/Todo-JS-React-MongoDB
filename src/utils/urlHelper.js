/**
 * Helper utilities for URL detection, normalization, domain extraction, and YouTube preview
 */

export function normalizeUrl(rawUrl) {
  if (!rawUrl) return '';
  let trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

export function extractDomain(rawUrl) {
  try {
    const parsed = new URL(normalizeUrl(rawUrl));
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return rawUrl || '';
  }
}

export function extractYouTubeId(rawUrl) {
  if (!rawUrl) return null;
  try {
    const url = normalizeUrl(rawUrl);
    // Matches:
    // youtube.com/watch?v=VIDEO_ID
    // youtu.be/VIDEO_ID
    // youtube.com/embed/VIDEO_ID
    // youtube.com/shorts/VIDEO_ID
    // youtube.com/v/VIDEO_ID
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function getYouTubeThumbnail(rawUrl) {
  const videoId = extractYouTubeId(rawUrl);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function detectCategory(rawUrl) {
  if (!rawUrl) return 'other';
  const urlLower = rawUrl.toLowerCase();

  // 1. YouTube
  if (
    urlLower.includes('youtube.com') ||
    urlLower.includes('youtu.be')
  ) {
    return 'youtube';
  }

  // 2. Courses
  const courseDomains = [
    'coursera.org',
    'udemy.com',
    'edx.org',
    'pluralsight.com',
    'skillshare.com',
    'codecademy.com',
    'khanacademy.org',
    'scrimba.com',
    'frontendmasters.com',
    'egghead.io',
    'datacamp.com',
    'classcentral.com',
    'freecodecamp.org',
    'ocw.mit.edu',
    'online.stanford.edu',
    'udacity.com',
    'futurelearn.com',
    'interaction-design.org',
    'stepik.org',
    'canvas.net',
  ];
  if (courseDomains.some((d) => urlLower.includes(d)) || urlLower.includes('/course/') || urlLower.includes('/learn/')) {
    return 'course';
  }

  // 3. Research Papers
  const paperDomains = [
    'arxiv.org',
    'biorxiv.org',
    'medrxiv.org',
    'semanticscholar.org',
    'sciencedirect.com',
    'nature.com',
    'ieee.org',
    'acm.org',
    'researchgate.net',
    'springer.com',
    'openreview.net',
    'paperswithcode.com',
    'scholar.google.',
    'ncbi.nlm.nih.gov',
    'frontiersin.org',
    'cell.com',
    'thelancet.com',
    'jstor.org',
    'academia.edu',
  ];
  if (paperDomains.some((d) => urlLower.includes(d)) || urlLower.endsWith('.pdf') || urlLower.includes('/abs/') || urlLower.includes('/pdf/')) {
    return 'paper';
  }

  // 4. Blogs & Articles
  const blogDomains = [
    'medium.com',
    'dev.to',
    'substack.com',
    'hashnode.dev',
    'hashnode.com',
    'wordpress.com',
    'blogspot.com',
    'ghost.io',
    'css-tricks.com',
    'smashingmagazine.com',
    'hackernoon.com',
    'towardsdatascience.com',
    'betterprogramming.pub',
    'engineering.',
    'blog.',
  ];
  if (blogDomains.some((d) => urlLower.includes(d)) || urlLower.includes('/blog/') || urlLower.includes('/article/') || urlLower.includes('/post/')) {
    return 'blog';
  }

  return 'other';
}

export function generateSuggestedTitle(rawUrl, category) {
  if (!rawUrl) return '';
  const domain = extractDomain(rawUrl);

  try {
    const parsed = new URL(normalizeUrl(rawUrl));
    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];

    if (lastSegment && !lastSegment.includes('=') && lastSegment.length > 2) {
      // Clean up hyphens and underscores
      const cleaned = decodeURIComponent(lastSegment)
        .replace(/\.(html|php|pdf|aspx)$/i, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      if (cleaned && cleaned.length > 3) {
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
    }
  } catch {}

  const categoryNames = {
    youtube: 'YouTube Video',
    course: 'Course',
    paper: 'Research Paper',
    blog: 'Blog Post',
    other: 'Resource Link',
  };

  return `${categoryNames[category] || 'Saved Link'} on ${domain || 'Web'}`;
}
