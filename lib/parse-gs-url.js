export default function parseGsUrl(url) {
  if (url && url.includes("https://nft.gamestop.com/token/")) {
    const processed = url
      .replace(/https:\/\/nft.gamestop.com\/token\//i, "")
      .split(/\//i);
    return {
      contract: processed[0],
      token: processed[1],
    };
  }

  return {};
}
