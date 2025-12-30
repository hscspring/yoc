import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
    createClient,
    fetchCalendar,
    fetchRepoContributions,
    fetchLanguages,
    fetchPullRequests,
    fetchReviews,
    fetchIssues,
    fetchIssueComments,
    fetchCreatedRepos
} from '../services/github';
import { generateProfile } from '../services/processor';

export const usePipeline = () => {
    const { token, viewer, setPipelineState, llmConfig } = useApp();

    const run = useCallback(async () => {
        if (!token || !viewer) return;

        const client = createClient(token);
        const targetYear = llmConfig.year || new Date().getFullYear();
        const yearStart = new Date(targetYear, 0, 1).toISOString();
        const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59).toISOString();

        setPipelineState(prev => ({ ...prev, status: 'running', logs: ['Starting pipeline...'] }));

        try {
            // Step 2: Calendar
            setPipelineState(prev => ({ ...prev, step: 2, logs: [...prev.logs, 'Fetching contribution calendar...'] }));
            const calendar = await fetchCalendar(client, viewer.login, yearStart, yearEnd);

            // Step 3: By Repo
            setPipelineState(prev => ({ ...prev, step: 3, logs: [...prev.logs, 'Fetching repo contributions...'] }));
            const byRepo = await fetchRepoContributions(client, viewer.login, yearStart, yearEnd);

            // Step 4: Languages
            setPipelineState(prev => ({ ...prev, step: 4, logs: [...prev.logs, 'Fetching languages...'] }));
            const languages = await fetchLanguages(client, viewer.login);

            // Step 6: Collaboration
            setPipelineState(prev => ({ ...prev, step: 6, logs: [...prev.logs, 'Fetching collaboration data (PRs, Issues)...'] }));

            const [prsResult, reviewsResult, issuesResult, commentsResult, createdReposResult] = await Promise.allSettled([
                fetchPullRequests(client, viewer.login, yearStart),
                fetchReviews(client, viewer.login, yearStart, yearEnd),
                fetchIssues(client, viewer.login, yearStart),
                fetchIssueComments(client, viewer.login, yearStart),
                fetchCreatedRepos(client, viewer.login, yearStart)
            ]);

            const prs = prsResult.status === 'fulfilled' ? prsResult.value : [];
            const reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value : [];
            const issues = issuesResult.status === 'fulfilled' ? issuesResult.value : [];
            const comments = commentsResult.status === 'fulfilled' ? commentsResult.value : [];
            const created_repos = createdReposResult.status === 'fulfilled' ? createdReposResult.value : [];

            if (prsResult.status === 'rejected') console.error("PR Fetch Failed", prsResult.reason);
            if (reviewsResult.status === 'rejected') console.error("Review Fetch Failed", reviewsResult.reason);
            if (issuesResult.status === 'rejected') console.error("Issue Fetch Failed", issuesResult.reason);
            if (commentsResult.status === 'rejected') console.error("Comment Fetch Failed", commentsResult.reason);

            // Store Raw Events
            const rawEvents = {
                calendar,
                byRepo,
                languages,
                collaboration: { prs, reviews, issues, comments },
                created_repos
            };

            setPipelineState(prev => ({ ...prev, step: 8, logs: [...prev.logs, 'Calculating metrics and behaviors...'] }));

            let profile;
            try {
                profile = generateProfile(rawEvents);
            } catch (e) {
                console.error("Profile Calculation Error:", e);
                // Create a fallback profile to avoid white screen
                profile = {
                    metrics: { activity: { active_days: 0, total_contributions: 0, peak_day: { date: '', contributionCount: 0 } }, focus: { main_language: 'Unknown', repo_count: 0 }, collaboration: { review_count: 0, total_prs: 0, merged_ratio: 0 } },
                    behaviors: { focus_score: 0, consistency_score: 0 },
                    labels: ['Data Error'],
                    profile_version: 'error'
                };
            }

            setPipelineState(prev => ({
                ...prev,
                status: 'completed',
                step: 11,
                logs: [...prev.logs, 'Pipeline completed successfully.'],
                data: { rawEvents, profile }
            }));

        } catch (error) {
            console.error(error);
            setPipelineState(prev => ({
                ...prev,
                status: 'error',
                logs: [...prev.logs, `Error: ${error.message}`]
            }));
        }

    }, [token, viewer, setPipelineState, llmConfig.year]);

    return { run };
};
