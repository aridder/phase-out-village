/**
 * Routes where the game loop is active. Inside these, the app shows the
 * game chrome (status timeline, game navigation, guided action footer).
 * Outside them — the front page calculator, the transition page and the
 * advisor — only a slim brand header with an entry point into the game.
 */
export const GAME_ROUTES = [
  "/map",
  "/phaseout",
  "/plan",
  "/emissions",
  "/production",
  "/data",
  "/summary",
];

export function isGameRoute(pathname: string): boolean {
  return GAME_ROUTES.some((route) => pathname.startsWith(route));
}
