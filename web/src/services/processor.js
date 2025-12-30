
export const calculateMetrics = (rawEvents) => {
    const { calendar = {}, byRepo = [], languages = [], collaboration = {} } = rawEvents || {};

    // 1. Activity Metrics
    const weeks = calendar?.weeks || [];
    let contributionDays = [];
    weeks.forEach(week => {
        if (week?.contributionDays) {
            contributionDays = [...contributionDays, ...week.contributionDays];
        }
    });

    // Filter for non-zero contributions
    const activeDays = contributionDays.filter(d => d && d.contributionCount > 0);
    const totalActiveDays = activeDays.length;
    const totalContributions = calendar?.totalContributions || 0;

    // Peak Day
    const peakDay = activeDays.length > 0
        ? activeDays.reduce((max, current) =>
            current.contributionCount > max.contributionCount ? current : max
            , { contributionCount: 0 })
        : { contributionCount: 0, date: '' };

    // Weekend Ratio (simple date check)
    const weekenddays = activeDays.filter(d => {
        if (!d.date) return false;
        const day = new Date(d.date).getDay();
        return day === 0 || day === 6;
    });
    const weekendRatio = totalActiveDays > 0 ? weekenddays.length / totalActiveDays : 0;

    // 2. Focus Metrics
    const repos = Array.isArray(byRepo) ? byRepo : [];
    const totalRepoCommits = repos.reduce((sum, r) => sum + (r?.contributions?.totalCount || 0), 0);
    const topRepo = repos.length > 0 ? repos[0] : null;
    const topRepoRatio = totalRepoCommits > 0 && topRepo
        ? (topRepo.contributions?.totalCount || 0) / totalRepoCommits
        : 0;

    // Top 3 Languages
    const langMap = {};
    const excludedLanguages = ['Jupyter Notebook', 'HTML', 'CSS', 'Shell'];
    if (languages && Array.isArray(languages)) {
        languages.forEach(repo => {
            const repoLangs = repo?.languages?.edges || [];
            repoLangs.forEach(edge => {
                const name = edge?.node?.name;
                const size = edge?.size || 0;
                if (name && !excludedLanguages.includes(name)) {
                    langMap[name] = (langMap[name] || 0) + size;
                }
            });
        });
    }
    const topLanguages = Object.entries(langMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, size]) => ({ name, size }));

    const mainLanguage = topLanguages.length > 0 ? topLanguages[0].name : 'Unknown';

    // 3. Collaboration Metrics
    const prs = collaboration?.prs || [];
    const reviews = collaboration?.reviews || [];
    const issues = collaboration?.issues || [];
    const comments = collaboration?.comments || [];

    const totalPrs = prs.length;
    const mergedPrs = prs.filter(pr => pr && pr.merged).length;
    const mergedRatio = totalPrs > 0 ? mergedPrs / totalPrs : 0;

    const reviewCount = reviews.length;
    const issueCount = issues.length;

    // Peak Time Calculation
    // Aggregating timestamps from all available sources
    const hours = new Array(24).fill(0);
    const processTimestamp = (ts) => {
        if (!ts) return;
        try {
            const date = new Date(ts);
            hours[date.getHours()]++;
        } catch (e) { /* ignore invalid dates */ }
    };

    prs.forEach(p => processTimestamp(p.createdAt));
    reviews.forEach(r => processTimestamp(r.submittedAt));
    issues.forEach(i => processTimestamp(i.createdAt));
    comments.forEach(c => processTimestamp(c.createdAt));

    let maxHour = 0;
    let maxCount = 0;
    hours.forEach((count, h) => {
        if (count > maxCount) {
            maxCount = count;
            maxHour = h;
        }
    });

    let peakTimeLabel = 'Daytime'; // Default
    if (maxHour >= 6 && maxHour < 12) peakTimeLabel = 'Morning';
    else if (maxHour >= 12 && maxHour < 18) peakTimeLabel = 'Afternoon';
    else if (maxHour >= 18 && maxHour < 24) peakTimeLabel = 'Evening';
    else peakTimeLabel = 'Night';

    // Collaboration Score (Simple heuristic)
    const reviewRatio = totalContributions > 0 ? reviewCount / totalContributions : 0;

    return {
        activity: {
            active_days: totalActiveDays,
            total_contributions: totalContributions,
            peak_day: peakDay,
            weekend_ratio: weekendRatio,
            created_project_count: Array.isArray(rawEvents?.created_repos) ? rawEvents.created_repos.length : 0,
            peak_time: {
                hour: maxHour,
                label: peakTimeLabel,
                count: maxCount
            }
        },
        focus: {
            repo_count: repos.length,
            top_repo_ratio: topRepoRatio,
            main_language: mainLanguage,
            top_languages: topLanguages
        },
        collaboration: {
            total_prs: totalPrs,
            merged_ratio: mergedRatio,
            review_count: reviewCount,
            issue_count: issueCount,
            review_ratio: reviewRatio
        }
    };
};

export const calculateBehaviors = (metrics) => {
    // Normalize scores to 0-1 range roughly

    // Focus Score: High top_repo_ratio -> High Focus
    const focusScore = metrics.focus.top_repo_ratio;

    // Consistency Score: active_days / 365
    const consistencyScore = Math.min(metrics.activity.active_days / 365, 1);

    // Collaboration Score: Weighted sum of PRs, Reviews
    // Heuristic: 50 reviews is "high" (1.0)
    const collabActivity = metrics.collaboration.review_count + metrics.collaboration.total_prs;
    const collaborationScore = Math.min(collabActivity / 50, 1);

    // Burstiness could be calculated if we had variance, but using peak/avg ratio as proxy?
    // Avg contributions per active day
    const avgContrib = metrics.activity.active_days > 0
        ? metrics.activity.total_contributions / metrics.activity.active_days
        : 0;
    const peak = metrics.activity.peak_day.contributionCount;
    // If peak is 10x average -> high burst
    const burstRatio = avgContrib > 0 ? Math.min((peak / avgContrib) / 10, 1) : 0;

    return {
        focus_score: parseFloat(focusScore.toFixed(2)),
        consistency_score: parseFloat(consistencyScore.toFixed(2)),
        collaboration_score: parseFloat(collaborationScore.toFixed(2)),
        burstiness_score: parseFloat(burstRatio.toFixed(2))
    };
};

export const mapLabels = (behaviors, metrics) => {
    const labels = [];

    if (behaviors.focus_score > 0.7) labels.push("High Focus");
    if (behaviors.focus_score < 0.3 && metrics.focus.repo_count > 10) labels.push("Explorer");

    if (metrics.activity.weekend_ratio > 0.3) labels.push("Weekend Warrior");
    if (metrics.activity.weekend_ratio < 0.05) labels.push("Work-Life Balanced");

    if (behaviors.collaboration_score > 0.6) labels.push("Collaborator");
    if (metrics.collaboration.review_count > 20) labels.push("Code Reviewer");
    if (metrics.collaboration.merged_ratio > 0.9) labels.push("Ship It!");

    if (behaviors.consistency_score > 0.6) labels.push("Consistent");
    if (behaviors.burstiness_score > 0.7) labels.push("Sprinter");

    return labels;
};

export const generateProfile = (rawEvents) => {
    const metrics = calculateMetrics(rawEvents);
    const behaviors = calculateBehaviors(metrics);
    const labels = mapLabels(behaviors, metrics);

    return {
        profile_version: "2025.behavior.v1",
        metrics,
        behaviors,
        labels
    };
};
