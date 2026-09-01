import dashboardService from '../services/dashboardService.js';

// @desc    Get dashboard stats
// @route   GET /api/dashboard/statistics
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const stats = await dashboardService.getStatistics(req.query);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard charts
// @route   GET /api/dashboard/charts
// @access  Private
const getDashboardCharts = async (req, res) => {
  try {
    const charts = await dashboardService.getCharts();
    res.json(charts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getDashboardStats, getDashboardCharts };
