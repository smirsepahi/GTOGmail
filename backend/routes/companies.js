const express = require('express');
const router = express.Router();

// In-memory storage for companies (in production, use a database)
let companies = [
  {
    id: '1',
    name: 'McKinsey & Company',
    domain: 'mckinsey.com',
    color: 'bg-blue-100 text-blue-800',
    dailyGoal: 2,
    weeklyGoal: 10,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Bain & Company',
    domain: 'bain.com',
    color: 'bg-green-100 text-green-800',
    dailyGoal: 1,
    weeklyGoal: 7,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Boston Consulting Group',
    domain: 'bcg.com',
    color: 'bg-purple-100 text-purple-800',
    dailyGoal: 1,
    weeklyGoal: 5,
    createdAt: new Date().toISOString()
  }
];

// Get all companies
router.get('/', (req, res) => {
  res.json(companies);
});

// Get company by ID
router.get('/:id', (req, res) => {
  const company = companies.find(c => c.id === req.params.id);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }
  res.json(company);
});

// Create new company
router.post('/', (req, res) => {
  const { name, domain, color, dailyGoal, weeklyGoal } = req.body;

  if (!name || !domain) {
    return res.status(400).json({ error: 'Name and domain are required' });
  }

  // Check if domain already exists
  const existingCompany = companies.find(c => c.domain.toLowerCase() === domain.toLowerCase());
  if (existingCompany) {
    return res.status(400).json({ error: 'Company with this domain already exists' });
  }

  const newCompany = {
    id: Date.now().toString(),
    name,
    domain: domain.toLowerCase(),
    color: color || 'bg-gray-100 text-gray-800',
    dailyGoal: dailyGoal || 1,
    weeklyGoal: weeklyGoal || 5,
    createdAt: new Date().toISOString()
  };

  companies.push(newCompany);
  res.status(201).json(newCompany);
});

// Update company
router.put('/:id', (req, res) => {
  const companyIndex = companies.findIndex(c => c.id === req.params.id);
  if (companyIndex === -1) {
    return res.status(404).json({ error: 'Company not found' });
  }

  const { name, domain, color, dailyGoal, weeklyGoal } = req.body;

  // Check if domain already exists (excluding current company)
  if (domain) {
    const existingCompany = companies.find(c =>
      c.domain.toLowerCase() === domain.toLowerCase() && c.id !== req.params.id
    );
    if (existingCompany) {
      return res.status(400).json({ error: 'Company with this domain already exists' });
    }
  }

  const updatedCompany = {
    ...companies[companyIndex],
    ...(name && { name }),
    ...(domain && { domain: domain.toLowerCase() }),
    ...(color && { color }),
    ...(dailyGoal !== undefined && { dailyGoal }),
    ...(weeklyGoal !== undefined && { weeklyGoal }),
    updatedAt: new Date().toISOString()
  };

  companies[companyIndex] = updatedCompany;
  res.json(updatedCompany);
});

// Delete company
router.delete('/:id', (req, res) => {
  const companyIndex = companies.findIndex(c => c.id === req.params.id);
  if (companyIndex === -1) {
    return res.status(404).json({ error: 'Company not found' });
  }

  companies.splice(companyIndex, 1);
  res.json({ message: 'Company deleted successfully' });
});

// Get company email statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const company = companies.find(c => c.id === req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const timeframe = req.query.timeframe || 'week';

    // Get real Gmail statistics
    const gmailService = req.app.locals.gmailService;
    const userTokens = req.app.locals.userTokens;

    let todayCount = 0;
    let weekCount = 0;

    if (gmailService && userTokens) {
      try {
        const userId = 'default';
        const tokens = userTokens[userId];

        if (tokens) {
          gmailService.setCredentials(tokens);

          // Get today's stats
          const todayStats = await gmailService.getDomainStats('today');
          todayCount = todayStats.domainCounts[company.domain.toLowerCase()] || 0;

          // Get week's stats
          const weekStats = await gmailService.getDomainStats('week');
          weekCount = weekStats.domainCounts[company.domain.toLowerCase()] || 0;
        }
      } catch (error) {
        console.error('Error getting Gmail stats for company:', error);
        // Continue with 0 counts if Gmail API fails
      }
    }

    // Calculate progress percentages
    const dailyProgress = company.dailyGoal > 0 ? Math.min(Math.round((todayCount / company.dailyGoal) * 100), 100) : 0;
    const weeklyProgress = company.weeklyGoal > 0 ? Math.min(Math.round((weekCount / company.weeklyGoal) * 100), 100) : 0;

    const stats = {
      companyId: company.id,
      companyName: company.name,
      domain: company.domain,
      timeframe,
      dailyGoal: company.dailyGoal,
      weeklyGoal: company.weeklyGoal,
      todayCount,
      weekCount,
      progress: {
        daily: dailyProgress,
        weekly: weeklyProgress
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting company stats:', error);
    res.status(500).json({ error: 'Failed to get company statistics' });
  }
});

// Get all companies with their current stats
router.get('/stats/summary', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'week';

    // Get real Gmail statistics
    const gmailService = req.app.locals.gmailService;
    const userTokens = req.app.locals.userTokens;

    let todayStats = null;
    let weekStats = null;

    if (gmailService && userTokens) {
      try {
        const userId = 'default';
        const tokens = userTokens[userId];

        if (tokens) {
          gmailService.setCredentials(tokens);

          // Get Gmail domain statistics
          todayStats = await gmailService.getDomainStats('today');
          weekStats = await gmailService.getDomainStats('week');
        }
      } catch (error) {
        console.error('Error getting Gmail stats for companies summary:', error);
        // Continue with null stats if Gmail API fails
      }
    }

    const companiesWithStats = companies.map(company => {
      const domain = company.domain.toLowerCase();

      // Get counts from Gmail stats or default to 0
      const todayCount = todayStats?.domainCounts[domain] || 0;
      const weekCount = weekStats?.domainCounts[domain] || 0;

      // Calculate progress percentages
      const dailyProgress = company.dailyGoal > 0 ? Math.min(Math.round((todayCount / company.dailyGoal) * 100), 100) : 0;
      const weeklyProgress = company.weeklyGoal > 0 ? Math.min(Math.round((weekCount / company.weeklyGoal) * 100), 100) : 0;

      return {
        ...company,
        stats: {
          todayCount,
          weekCount,
          progress: {
            daily: dailyProgress,
            weekly: weeklyProgress
          }
        }
      };
    });

    res.json(companiesWithStats);
  } catch (error) {
    console.error('Error getting companies stats summary:', error);
    res.status(500).json({ error: 'Failed to get companies statistics' });
  }
});

module.exports = router;
