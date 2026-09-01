import feeService from '../services/feeService.js';

// @desc    Get monthly collection report
// @route   GET /api/reports/monthly
// @access  Private
const getMonthlyReport = async (req, res) => {
  try {
    const { month, session, year, class: studentClass, feeType, paymentMode } = req.query;
    const fees = await feeService.getAllFees({
      month,
      session: session || year,
      class: studentClass,
      feeType,
      paymentMode,
    });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get outstanding fee report
// @route   GET /api/reports/outstanding
// @access  Private
const getOutstandingReport = async (req, res) => {
  try {
    const { session, class: studentClass } = req.query;
    const fees = await feeService.getAllFees({ session, class: studentClass });
    // Outstanding records are any records with pending dues
    const outstanding = fees.filter((f) => f.dueAmount > 0);
    res.json(outstanding);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getMonthlyReport, getOutstandingReport };
