import feeService from '../services/feeService.js';

// @desc    Get all fee records
// @route   GET /api/fees
// @access  Private
const getFees = async (req, res) => {
  try {
    const fees = await feeService.getAllFees(req.query);
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get fee records by student ID
// @route   GET /api/fees/student/:studentId
// @access  Private
const getFeesByStudent = async (req, res) => {
  try {
    const fees = await feeService.getFeesByStudent(req.params.studentId, req.query.session);
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record a new fee payment
// @route   POST /api/fees
// @access  Private/Admin
const createFee = async (req, res) => {
  try {
    const createdFee = await feeService.createFee(req.body, req.user);
    res.status(201).json(createdFee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a fee record
// @route   PUT /api/fees/:id
// @access  Private/Admin
const updateFee = async (req, res) => {
  try {
    const updatedFee = await feeService.updateFee(req.params.id, req.body);
    res.json(updatedFee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a fee record
// @route   DELETE /api/fees/:id
// @access  Private/Admin
const deleteFee = async (req, res) => {
  try {
    await feeService.deleteFee(req.params.id);
    res.json({ message: 'Fee record removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export { getFees, getFeesByStudent, createFee, updateFee, deleteFee };
