import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { platform, url } = await req.json();

    if (!platform || !url) {
      return NextResponse.json(
        { error: "Platform and profile URL are required." },
        { status: 400 }
      );
    }

    const trimmedUrl = String(url).trim();

    // Must be https only
    if (!trimmedUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "Only secure https:// profile links are permitted." },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }

    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");
    const pathname = parsedUrl.pathname.replace(/\/+$/, "");

    // Platform URL domain and path validation
    switch (platform) {
      case "github": {
        if (hostname !== "github.com") {
          return NextResponse.json(
            { error: "This is not a valid GitHub profile link." },
            { status: 400 }
          );
        }
        const parts = pathname.split("/").filter(Boolean);
        if (parts.length !== 1) {
          return NextResponse.json(
            { error: "This is not a valid GitHub profile link. Expected https://github.com/username" },
            { status: 400 }
          );
        }
        const username = parts[0];

        // Fetch via Official GitHub REST API
        try {
          const ghRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
            headers: {
              "User-Agent": "Achievement-Hub-App",
              Accept: "application/vnd.github.v3+json",
            },
            next: { revalidate: 0 },
          });

          if (ghRes.status === 404 || !ghRes.ok) {
            return NextResponse.json(
              { error: "Couldn't fetch data from this link. User does not exist or profile is unavailable." },
              { status: 404 }
            );
          }

          const ghData = await ghRes.json();
          return NextResponse.json({
            success: true,
            stats: {
              username: ghData.login,
              url: `https://github.com/${ghData.login}`,
              repos: ghData.public_repos ?? 0,
              followers: ghData.followers ?? 0,
              last_updated: new Date().toISOString(),
            },
          });
        } catch {
          return NextResponse.json(
            { error: "Couldn't fetch data from this link." },
            { status: 502 }
          );
        }
      }

      case "codeforces": {
        if (hostname !== "codeforces.com") {
          return NextResponse.json(
            { error: "This is not a valid Codeforces profile link." },
            { status: 400 }
          );
        }
        const parts = pathname.split("/").filter(Boolean);
        // Supports https://codeforces.com/profile/handle
        if (parts.length < 2 || parts[0] !== "profile") {
          return NextResponse.json(
            { error: "This is not a valid Codeforces profile link. Expected https://codeforces.com/profile/handle" },
            { status: 400 }
          );
        }
        const username = parts[1];

        // Fetch via Official Codeforces API
        try {
          const cfRes = await fetch(
            `https://codeforces.com/api/user.info?handles=${encodeURIComponent(username)}`,
            { next: { revalidate: 0 } }
          );
          const cfData = await cfRes.json();

          if (cfData.status !== "OK" || !cfData.result || cfData.result.length === 0) {
            return NextResponse.json(
              { error: "Couldn't fetch data from this link. Handle not found on Codeforces." },
              { status: 404 }
            );
          }

          const userObj = cfData.result[0];

          // Submissions check for problems solved
          let solvedCount = 0;
          try {
            const subRes = await fetch(
              `https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}&from=1&count=100`,
              { next: { revalidate: 0 } }
            );
            const subData = await subRes.json();
            if (subData.status === "OK" && Array.isArray(subData.result)) {
              const uniqueProblems = new Set();
              subData.result.forEach((sub: any) => {
                if (sub.verdict === "OK" && sub.problem) {
                  uniqueProblems.add(`${sub.problem.contestId}_${sub.problem.index}`);
                }
              });
              solvedCount = uniqueProblems.size;
            }
          } catch {
            solvedCount = 0;
          }

          return NextResponse.json({
            success: true,
            stats: {
              username: userObj.handle,
              url: `https://codeforces.com/profile/${userObj.handle}`,
              rating: userObj.rating ?? 0,
              maxRating: userObj.maxRating ?? 0,
              rank: userObj.rank ?? "unrated",
              solved: solvedCount,
              last_updated: new Date().toISOString(),
            },
          });
        } catch {
          return NextResponse.json(
            { error: "Couldn't fetch data from this link." },
            { status: 502 }
          );
        }
      }

      case "leetcode": {
        if (hostname !== "leetcode.com") {
          return NextResponse.json(
            { error: "This is not a valid LeetCode profile link." },
            { status: 400 }
          );
        }
        const parts = pathname.split("/").filter(Boolean);
        // Matches /u/username or /username
        const username = parts[0] === "u" && parts.length > 1 ? parts[1] : parts[0];
        if (!username) {
          return NextResponse.json(
            { error: "This is not a valid LeetCode profile link. Expected https://leetcode.com/u/username" },
            { status: 400 }
          );
        }

        // NOTE: LeetCode does not have an official REST API.
        // We use the public GraphQL endpoint to fetch submission counts.
        try {
          const query = {
            query: `
              query getUserProfile($username: String!) {
                matchedUser(username: $username) {
                  username
                  submitStats: submitStatsGlobal {
                    acSubmissionNum {
                      difficulty
                      count
                    }
                  }
                }
              }
            `,
            variables: { username },
          };

          const lcRes = await fetch("https://leetcode.com/graphql", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Referer: `https://leetcode.com/${username}/`,
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            },
            body: JSON.stringify(query),
            next: { revalidate: 0 },
          });

          const lcData = await lcRes.json();
          const matched = lcData?.data?.matchedUser;

          if (!matched || !matched.submitStats?.acSubmissionNum) {
            return NextResponse.json(
              { error: "Couldn't fetch data from this link. LeetCode profile not found or private." },
              { status: 404 }
            );
          }

          const statsArr = matched.submitStats.acSubmissionNum;
          let total = 0;
          let easy = 0;
          let medium = 0;
          let hard = 0;

          statsArr.forEach((item: any) => {
            if (item.difficulty === "All") total = item.count;
            if (item.difficulty === "Easy") easy = item.count;
            if (item.difficulty === "Medium") medium = item.count;
            if (item.difficulty === "Hard") hard = item.count;
          });

          return NextResponse.json({
            success: true,
            stats: {
              username: matched.username,
              url: `https://leetcode.com/u/${matched.username}`,
              totalSolved: total,
              easy,
              medium,
              hard,
              last_updated: new Date().toISOString(),
            },
          });
        } catch {
          return NextResponse.json(
            { error: "Couldn't fetch data from this link." },
            { status: 502 }
          );
        }
      }

      case "hackerrank": {
        if (!hostname.includes("hackerrank.com")) {
          return NextResponse.json(
            { error: "This is not a valid HackerRank profile link." },
            { status: 400 }
          );
        }
        const parts = pathname.split("/").filter(Boolean);
        // Matches /profile/username or /username
        const username = parts[0] === "profile" && parts.length > 1 ? parts[1] : parts[0];
        if (!username) {
          return NextResponse.json(
            { error: "This is not a valid HackerRank profile link. Expected https://www.hackerrank.com/profile/username" },
            { status: 400 }
          );
        }

        // NOTE: HackerRank public REST endpoint (unofficial internal endpoint)
        try {
          const hrRes = await fetch(
            `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/badges`,
            {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                Accept: "application/json",
              },
              next: { revalidate: 0 },
            }
          );

          if (!hrRes.ok) {
            return NextResponse.json(
              { error: "Couldn't fetch data from this link. HackerRank profile not found." },
              { status: 404 }
            );
          }

          const hrData = await hrRes.json();
          const models = hrData?.models || [];
          let starsCount = 0;
          models.forEach((m: any) => {
            starsCount += m.stars || 0;
          });

          return NextResponse.json({
            success: true,
            stats: {
              username,
              url: `https://www.hackerrank.com/profile/${username}`,
              badges: models.length,
              stars: starsCount,
              last_updated: new Date().toISOString(),
            },
          });
        } catch {
          return NextResponse.json(
            { error: "Couldn't fetch data from this link." },
            { status: 502 }
          );
        }
      }

      case "credly": {
        if (hostname !== "credly.com") {
          return NextResponse.json(
            { error: "This is not a valid Credly profile link." },
            { status: 400 }
          );
        }
        const parts = pathname.split("/").filter(Boolean);
        // Matches https://www.credly.com/users/username/badges or /users/username
        if (parts.length < 2 || parts[0] !== "users") {
          return NextResponse.json(
            { error: "This is not a valid Credly profile link. Expected https://www.credly.com/users/username" },
            { status: 400 }
          );
        }
        const username = parts[1];

        // NOTE: Credly public badges JSON endpoint (unofficial public feed)
        try {
          const credRes = await fetch(
            `https://www.credly.com/users/${encodeURIComponent(username)}/badges.json`,
            {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                Accept: "application/json",
              },
              next: { revalidate: 0 },
            }
          );

          if (!credRes.ok) {
            return NextResponse.json(
              { error: "Couldn't fetch data from this link. Credly user not found or badges are private." },
              { status: 404 }
            );
          }

          const credData = await credRes.json();
          const badges = credData?.data || [];

          return NextResponse.json({
            success: true,
            stats: {
              username,
              url: `https://www.credly.com/users/${username}`,
              badgeCount: badges.length,
              last_updated: new Date().toISOString(),
            },
          });
        } catch {
          return NextResponse.json(
            { error: "Couldn't fetch data from this link." },
            { status: 502 }
          );
        }
      }

      default:
        return NextResponse.json({ error: "Unsupported platform." }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error syncing platform profile: " + err.message },
      { status: 500 }
    );
  }
}
