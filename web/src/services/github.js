import { Octokit } from "octokit";

export const createClient = (token) => {
  return new Octokit({ auth: token });
};

export const VIEWER_QUERY = `
query Viewer {
  viewer {
    id
    login
    name
  }
}
`;

export const CALENDAR_QUERY = `
query ContributionsCalendar(
  $login: String!
  $from: DateTime!
  $to: DateTime!
) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}
`;

export const REPO_CONTRIB_QUERY = `
query ContributionsByRepo(
  $login: String!
  $from: DateTime!
  $to: DateTime!
) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      commitContributionsByRepository {
        repository {
          name
          owner { login }
        }
        contributions {
          totalCount
        }
      }
    }
  }
}
`;

export const LANGUAGES_QUERY = `
query RepositoriesLanguages(
  $login: String!
) {
  user(login: $login) {
    repositories(
      first: 100
      ownerAffiliations: OWNER
      isFork: false
      orderBy: { field: UPDATED_AT, direction: DESC }
    ) {
      nodes {
        name
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges {
            node { name }
            size
          }
        }
      }
    }
  }
}
`;

export const PRS_QUERY = `
query PullRequests($login: String!, $cursor: String) {
  user(login: $login) {
    pullRequests(first: 50, after: $cursor, orderBy: { field: CREATED_AT, direction: DESC }) {
      pageInfo { hasNextPage, endCursor }
      nodes { createdAt merged mergedAt repository { name owner { login } } }
    }
  }
}
`;

export const REVIEWS_QUERY = `
query PullRequestReviews($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      pullRequestReviewContributions(first: 100) {
        nodes {
          occurredAt
          pullRequestReview {
            state
            pullRequest { repository { name } }
          }
        }
      }
    }
  }
}
`;

export const ISSUES_QUERY = `
query Issues($login: String!, $cursor: String) {
  user(login: $login) {
    issues(first: 50, after: $cursor, orderBy: { field: CREATED_AT, direction: DESC }) {
      pageInfo { hasNextPage, endCursor }
      nodes { createdAt closedAt repository { name } }
    }
  }
}
`;

export const COMMENTS_QUERY = `
query IssueComments($login: String!, $cursor: String) {
  user(login: $login) {
    issueComments(first: 50, after: $cursor) {
      pageInfo { hasNextPage, endCursor }
      nodes { createdAt issue { repository { name } } }
    }
  }
}
`;

export const CREATED_REPOS_QUERY = `
query CreatedRepos($login: String!, $cursor: String) {
  user(login: $login) {
    repositories(first: 50, after: $cursor, orderBy: {field: CREATED_AT, direction: DESC}) {
      pageInfo { hasNextPage, endCursor }
      nodes {
        name
        createdAt
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 1) {
                totalCount
              }
            }
          }
        }
      }
    }
  }
}
`;

export const fetchViewer = async (client) => {
  try {
    console.log('[fetchViewer] Starting...');
    const data = await client.graphql(VIEWER_QUERY);
    console.log('[fetchViewer] Success:', data);
    return data.viewer;
  } catch (error) {
    console.error('[fetchViewer] Error:', error);
    throw error;
  }
};

export const fetchCalendar = async (client, login, from, to) => {
  const data = await client.graphql(CALENDAR_QUERY, { login, from, to });
  return data?.user?.contributionsCollection?.contributionCalendar;
};

export const fetchRepoContributions = async (client, login, from, to) => {
  const data = await client.graphql(REPO_CONTRIB_QUERY, { login, from, to });
  return data?.user?.contributionsCollection?.commitContributionsByRepository || [];
};

export const fetchLanguages = async (client, login) => {
  const data = await client.graphql(LANGUAGES_QUERY, { login });
  return data?.user?.repositories?.nodes || [];
};

// Generic paginated fetcher
const fetchPaginated = async (client, query, login, extractNodes, extractPageInfo, since) => {
  let allNodes = [];
  let cursor = null;
  let hasNext = true;

  try {
    while (hasNext) {
      const data = await client.graphql(query, { login, cursor });
      const nodes = extractNodes(data);
      const pageInfo = extractPageInfo(data);

      if (!nodes) {
        console.warn("Empty nodes returned in pagination, stopping.");
        break;
      }

      // Filter by date if since is provided
      const validNodes = since ? nodes.filter(n => {
        if (!n) return false;
        const date = n.createdAt || n.submittedAt;
        return new Date(date) >= new Date(since);
      }) : nodes;

      allNodes = [...allNodes, ...validNodes];

      // Optimization: stop if we found nodes older than 'since'
      if (since && nodes.length > validNodes.length) {
        break;
      }

      cursor = pageInfo?.endCursor;
      hasNext = pageInfo?.hasNextPage;

      // Safety break
      if (allNodes.length > 2000) break;
    }
  } catch (e) {
    console.error("Pagination Error:", e);
    // Return what we have so far instead of crashing
  }
  return allNodes;
};

export const fetchPullRequests = async (client, login, since) => {
  return fetchPaginated(
    client, PRS_QUERY, login,
    (data) => data?.user?.pullRequests?.nodes || [],
    (data) => data?.user?.pullRequests?.pageInfo || {},
    since
  );
};

export const fetchReviews = async (client, login, from, to) => {
  try {
    const data = await client.graphql(REVIEWS_QUERY, { login, from, to });
    const nodes = data?.user?.contributionsCollection?.pullRequestReviewContributions?.nodes || [];
    return nodes.map(n => ({
      submittedAt: n.occurredAt,
      state: n.pullRequestReview?.state,
      pullRequest: n.pullRequestReview?.pullRequest
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
};

export const fetchIssues = async (client, login, since) => {
  return fetchPaginated(
    client, ISSUES_QUERY, login,
    (data) => data?.user?.issues?.nodes || [],
    (data) => data?.user?.issues?.pageInfo || {},
    since
  );
};

export const fetchIssueComments = async (client, login, since) => {
  return fetchPaginated(
    client, COMMENTS_QUERY, login,
    (data) => data?.user?.issueComments?.nodes || [],
    (data) => data?.user?.issueComments?.pageInfo || {},
    since
  );
};

export const fetchCreatedRepos = async (client, login, since) => {
  const repos = await fetchPaginated(
    client, CREATED_REPOS_QUERY, login,
    (data) => data?.user?.repositories?.nodes || [],
    (data) => data?.user?.repositories?.pageInfo || {},
    since // This filters by createdAt >= since
  );

  // Filter for repos that have commits (history.totalCount > 0)
  // Note: Empty repos usually have null defaultBranchRef or 0 history
  return repos.filter(repo => {
    const commitCount = repo.defaultBranchRef?.target?.history?.totalCount || 0;
    return commitCount > 0;
  });
};
