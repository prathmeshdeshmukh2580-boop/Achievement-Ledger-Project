import { NextRequest, NextResponse } from "next/server";
import { PLATFORMS_CONFIG, PlatformId } from "@/lib/platformsConfig";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, url, metric1Label, metric1Value, metric2Label, metric2Value, highlight } = body;

    if (!platform || !url) {
      return NextResponse.json(
        { error: "Platform and profile URL are required." },
        { status: 400 }
      );
    }

    const platformKey = String(platform).toLowerCase() as PlatformId;
    const config = PLATFORMS_CONFIG[platformKey];

    if (!config) {
      return NextResponse.json({ error: "Unsupported platform." }, { status: 400 });
    }

    // Strict client/server validation using platform configuration
    const validation = config.validateAndExtract(String(url));
    if (!validation.valid || !validation.username || !validation.canonicalUrl) {
      return NextResponse.json(
        { error: validation.error || `Invalid ${config.name} profile URL.` },
        { status: 400 }
      );
    }

    const { username, canonicalUrl } = validation;

    // -------------------------------------------------------------------------
    // PLATFORMS WITH CLIENT/PROJECT METRICS (Tinkercad, GrabCAD, Wokwi, etc.)
    // Saves validated profile link + student's real project metrics & highlights.
    // Never show guessed or scraped-from-private data.
    // -------------------------------------------------------------------------
    if (!config.hasPublicStats) {
      return NextResponse.json({
        success: true,
        stats: {
          username,
          url: canonicalUrl,
          isLinkedOnly: true,
          metric1Label: metric1Label || config.defaultMetric1Label,
          metric1Value: metric1Value !== undefined && metric1Value !== null ? metric1Value : "",
          metric2Label: metric2Label || config.defaultMetric2Label,
          metric2Value: metric2Value !== undefined && metric2Value !== null ? metric2Value : "",
          highlight: highlight ? String(highlight).slice(0, 150) : (validation.extractedHighlight || undefined),
          last_updated: new Date().toISOString(),
        },
      });
    }

    // -------------------------------------------------------------------------
    // PLATFORMS WITH REAL PUBLIC APIS
    // Calls ONLY fixed hosts built strictly from the validated username.
    // Never calls the raw URL typed by the user.
    // -------------------------------------------------------------------------
    switch (platformKey) {
      case "github": {
        try {
          const ghRes = await fetch(
            `https://api.github.com/users/${encodeURIComponent(username)}`,
            {
              headers: {
                "User-Agent": "Achievement-Hub-App",
                Accept: "application/vnd.github.v3+json",
              },
              next: { revalidate: 0 },
            }
          );

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
              username: ghData.login || username,
              url: canonicalUrl,
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
              username: userObj.handle || username,
              url: canonicalUrl,
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
              Referer: `https://leetcode.com/${encodeURIComponent(username)}/`,
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
              username: matched.username || username,
              url: canonicalUrl,
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
              url: canonicalUrl,
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
        // NOTE: Unofficial public JSON endpoint for public Credly user badges
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
          const rawBadges = credData?.data || [];

          // Map full badge objects for Phase 2 integration
          const formattedBadges = rawBadges.map((b: any) => {
            const template = b.badge_template || {};
            const issuerEntity = template.issuer?.entities?.[0]?.entity?.name || b.issuer?.name || "Credly Partner";
            return {
              id: String(b.id || Math.random().toString(36).substring(2)),
              title: template.name || b.name || "Verified Credential",
              issuer: issuerEntity,
              image_url: template.image_url || b.image_url || null,
              issued_at: b.issued_at_date || b.issued_at || null,
              expires_at: b.expires_at_date || b.expires_at || null,
              badge_url: b.id ? `https://www.credly.com/badges/${b.id}/public_url` : canonicalUrl,
            };
          });

          return NextResponse.json({
            success: true,
            stats: {
              username,
              url: canonicalUrl,
              badgeCount: formattedBadges.length,
              badges: formattedBadges,
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

      case "googlescholar": {
        try {
          const res = await fetch(`https://scholar.google.com/citations?user=${encodeURIComponent(username)}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept-Language": "en-US,en;q=0.9",
            },
            next: { revalidate: 0 },
          });

          if (!res.ok) {
            return NextResponse.json(
              { error: "Couldn't fetch data from Google Scholar. Profile unavailable or ID not found." },
              { status: 404 }
            );
          }

          const html = await res.text();
          const nameMatch = html.match(/<div id="gsc_prf_in">([^<]+)<\/div>/i);
          const affMatch = html.match(/<div class="gsc_prf_il">([^<]+)<\/div>/i);
          const citMatches = html.match(/<td class="gsc_rsb_std">(\d[\d,]*)<\/td>/g);

          let citations = 0;
          let hIndex = 0;
          let i10Index = 0;

          if (citMatches && citMatches.length >= 6) {
            citations = parseInt(citMatches[0].replace(/<[^>]+>/g, "").replace(/,/g, ""), 10) || 0;
            hIndex = parseInt(citMatches[2].replace(/<[^>]+>/g, "").replace(/,/g, ""), 10) || 0;
            i10Index = parseInt(citMatches[4].replace(/<[^>]+>/g, "").replace(/,/g, ""), 10) || 0;
          }

          return NextResponse.json({
            success: true,
            stats: {
              username,
              url: canonicalUrl,
              name: nameMatch ? nameMatch[1].trim() : username,
              affiliation: affMatch ? affMatch[1].trim() : undefined,
              citations,
              hIndex,
              i10Index,
              last_updated: new Date().toISOString(),
            },
          });
        } catch {
          return NextResponse.json(
            { error: "Couldn't fetch data from Google Scholar." },
            { status: 502 }
          );
        }
      }

      case "orcid": {
        try {
          const res = await fetch(`https://pub.orcid.org/v3.0/${encodeURIComponent(username)}/record`, {
            headers: {
              Accept: "application/json",
              "User-Agent": "Achievement-Hub-App",
            },
            next: { revalidate: 0 },
          });

          if (!res.ok) {
            return NextResponse.json(
              { error: "Couldn't fetch data from ORCID. 16-digit iD not found." },
              { status: 404 }
            );
          }

          const orcidData = await res.json();
          const person = orcidData?.person;
          const given = person?.name?.["given-names"]?.value || "";
          const family = person?.name?.["family-name"]?.value || "";
          const fullName = (given + " " + family).trim() || username;
          const worksCount = orcidData?.["activities-summary"]?.works?.group?.length || 0;

          return NextResponse.json({
            success: true,
            stats: {
              username,
              url: canonicalUrl,
              name: fullName,
              worksCount,
              last_updated: new Date().toISOString(),
            },
          });
        } catch {
          return NextResponse.json(
            { error: "Couldn't fetch data from ORCID record." },
            { status: 502 }
          );
        }
      }

      default:
        return NextResponse.json({ error: "Unsupported platform." }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error syncing platform profile: " + (err.message || err) },
      { status: 500 }
    );
  }
}
