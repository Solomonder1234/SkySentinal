/**
 * ClearanceGuard — SkyAlert Clearance Level Permission System
 *
 * Maps Discord Role IDs to the SkyAlert clearance hierarchy:
 *   Level 6 - Owners        (VixWx, Jasmine) — Bypasses all checks
 *   Level 5 - Founders      (Ric, Goober, io3q)
 *   Level 4 - Co-Founders, Executive Board, Head of Staff
 *   Level 3 - Senior Admin, Admin
 *   Level 2 - Senior Moderator, Moderator
 *   Level 1 - Trial Staff
 *
 * Usage on a command:
 *   clearanceLevel: 3   // Only Level 3+ can run this command
 */

import { GuildMember } from 'discord.js';
import { OWNER_IDS } from '../config';

// Map Discord Role IDs to their clearance level.
// Update the role IDs here if they ever change in Discord.
const ROLE_CLEARANCE_MAP: Record<string, number> = {
    // --- Level 6: Owners ---
    '1275837940044226570': 6,  // Owner role

    // --- Level 5: Founders ---
    '1282527079828815944': 5,  // Co-Founder role (Main Guild)
    '1387636614699679754': 5,  // Co-Founder role (Staff Guild)

    // --- Level 4: Executive Board / Head of Staff ---
    '1366096466010968177': 4,  // Head of Staff (Main)
    '1387637435583828129': 4,  // Head of Staff (Staff)

    // --- Level 3: Senior Admin / Admin ---
    '1366077117376364625': 3,  // Senior Admin (Main)
    '1387637479858901092': 3,  // Senior Admin (Staff)
    '1275838130498568334': 3,  // Admin (Main)
    '1387637516055613460': 3,  // Admin (Staff)

    // --- Level 2: Senior Moderator / Moderator ---
    '1366097955676749844': 2,  // Senior Moderator (Main)
    '1387637559282368655': 2,  // Senior Moderator (Staff)
    '1275838245468639385': 2,  // Moderator (Main)
    '1387637616882487296': 2,  // Moderator (Staff)

    // --- Level 1: Trial Staff ---
    '1366099517740552265': 1,  // Trial Staff (Main)
    '1387736757394473051': 1,  // Trial Staff (Staff)
};

/**
 * Returns the highest clearance level a member holds.
 * Bot owners (in OWNER_IDS) are always granted Level 6.
 */
export function getMemberClearance(member: GuildMember): number {
    // Bot owners always have maximum clearance
    if (OWNER_IDS.includes(member.id)) return 6;

    let highest = 0;
    for (const [roleId, level] of Object.entries(ROLE_CLEARANCE_MAP)) {
        if (member.roles.cache.has(roleId) && level > highest) {
            highest = level;
        }
    }
    return highest;
}

/**
 * Returns true if the member meets or exceeds the required clearance level.
 */
export function hasClearance(member: GuildMember, required: number): boolean {
    return getMemberClearance(member) >= required;
}

/** Human-readable label for a clearance level, for use in error embeds. */
export function clearanceLabel(level: number): string {
    const labels: Record<number, string> = {
        6: 'Level 6 — Owner',
        5: 'Level 5 — Founder',
        4: 'Level 4 — Executive Board / Head of Staff',
        3: 'Level 3 — Senior Admin / Admin',
        2: 'Level 2 — Senior Moderator / Moderator',
        1: 'Level 1 — Trial Staff',
    };
    return labels[level] ?? `Level ${level}`;
}
