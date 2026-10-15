/**
 * 只在主客隊名稱對得上馬會足智彩公開賽事時才算可買。
 * 未逐場核對的比賽不會標示。
 */
const CONFIRMED_MATCHES: Array<readonly [string, string]> = [];

function sameSide(left: string, right: string) {
  return left === right;
}

export function hkjcOnSale(homeName: string, awayName: string) {
  return CONFIRMED_MATCHES.some(
    ([home, away]) => sameSide(home, homeName) && sameSide(away, awayName),
  );
}
