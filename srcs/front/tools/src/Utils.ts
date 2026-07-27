import { AuthResponse } from "./interfaces/AuthResponse";
import { API_BASE_URL } from "./config";

export const LogLevel = {
  INFO: false as boolean,
  WARN: false as boolean,
  ERROR: false as boolean,
  DEBUG: false as boolean,
} as const;

/**
 * trimIfEndsWith - trim a specific char from str end
 *
 * @param str: pahtname to check
 * @param c: character to be tested in str end
 * @returns: new str if true, otherwise same str
 */
function trimIfEndsWith(str: string, c: string): string {
  if (str.endsWith(c)) {
    return str.slice(0, -1);
  }
  return str;
}

async function checkAuthCookie(): Promise<AuthResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/auth/checkAuthCookie`,
      {
        method: "GET",
        credentials: "include", // Important: include cookies
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return { isAuthenticated: false, message: "Authentication check failed" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    Utils.LogLevel.ERROR && console.error("Auth check error:", error);
    return {
      isAuthenticated: false,
      message: "Network error during authentication check",
    };
  }
}

export const Utils = {
  LogLevel,
  checkAuthCookie,
  trimIfEndsWith,
};
