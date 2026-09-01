import studentService from '../services/studentService.js';

// @desc    Get all students
// @route   GET /api/students
// @access  Private
const getStudents = async (req, res) => {
  try {
    const students = await studentService.getAllStudents(req.query);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a student
// @route   POST /api/students
// @access  Private/Admin
const createStudent = async (req, res) => {
  try {
    const createdStudent = await studentService.createStudent(req.body);
    res.status(201).json(createdStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a student
// @route   PUT /api/students/:id
// @access  Private/Admin
const updateStudent = async (req, res) => {
  try {
    const updatedStudent = await studentService.updateStudent(req.params.id, req.body);
    res.json(updatedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
  try {
    await studentService.deleteStudent(req.params.id);
    res.json({ message: 'Student and associated fee records removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get student fee status for an academic session
// @route   GET /api/students/:id/fee-status
// @access  Private
const getStudentFeeStatus = async (req, res) => {
  try {
    const feeStatus = await studentService.getStudentFeeStatus(
      req.params.id,
      req.query.session
    );
    if (!feeStatus) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(feeStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get class-wise fee overview for all 4 preschool classes
// @route   GET /api/students/class-fee-overview
// @access  Private
const getClassFeeOverview = async (req, res) => {
  try {
    const overview = await studentService.getClassFeeOverview(req.query.session);
    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get class-level monthly fee status (paid vs pending)
// @route   GET /api/students/class/:className/monthly-status
// @access  Private
const getClassMonthlyFeeStatus = async (req, res) => {
  try {
    const { className } = req.params;
    const { month, session } = req.query;
    const result = await studentService.getClassMonthlyFeeStatus(className, month, session);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentFeeStatus,
  getClassFeeOverview,
  getClassMonthlyFeeStatus,
};



