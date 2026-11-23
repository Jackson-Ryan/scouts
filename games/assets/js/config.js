/* Games Finder configuration (inherits shared repo settings from site-config.js). */
import { SITE_SETTINGS } from "../../../assets/js/site-config.js";

export const SITE_CONFIG = {
  siteName: SITE_SETTINGS.siteName,
  toolName: "Games Finder",
  githubRepo: SITE_SETTINGS.githubRepo,
  issueLabel: "game-submission",
  savedKey: "scouts-games-saved-v1",
  gamesPerPage: 12,
};
