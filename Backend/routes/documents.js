import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, ownerOrAdmin } from '../middleware/auth.js';
import { validateDocumentUpload, validateObjectId } from '../middleware/validation.js';
import { catchAsync } from '../middleware/errorHandler.js';
import TaxDocument from '../models/TaxDocument.js';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Excel, CSV, and image files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private
router.post('/upload', upload.single('document'), validateDocumentUpload, catchAsync(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file'
    });
  }

  const { documentType, financialYear } = req.body;

  // Create document record
  const document = await TaxDocument.create({
    user: req.user._id,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
    documentType,
    financialYear
  });

  res.status(201).json({
    success: true,
    message: 'Document uploaded successfully',
    data: document
  });
}));

// @desc    Get all user documents
// @route   GET /api/documents
// @access  Private
router.get('/', catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const query = { user: req.user._id };

  // Add filters
  if (req.query.documentType) {
    query.documentType = req.query.documentType;
  }
  if (req.query.financialYear) {
    query.financialYear = req.query.financialYear;
  }
  if (req.query.status) {
    query.processingStatus = req.query.status;
  }

  const total = await TaxDocument.countDocuments(query);

  const documents = await TaxDocument
    .find(query)
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalDocuments: total,
    hasNext: page * limit < total,
    hasPrev: page > 1
  };

  res.status(200).json({
    success: true,
    count: documents.length,
    pagination,
    data: documents
  });
}));

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
router.get('/:id', validateObjectId, ownerOrAdmin(TaxDocument), catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: req.resource
  });
}));

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private
router.get('/:id/download', validateObjectId, ownerOrAdmin(TaxDocument), catchAsync(async (req, res, next) => {
  const document = req.resource;

  if (!fs.existsSync(document.path)) {
    return res.status(404).json({
      success: false,
      message: 'File not found on server'
    });
  }

  res.download(document.path, document.originalName);
}));

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
router.delete('/:id', validateObjectId, ownerOrAdmin(TaxDocument), catchAsync(async (req, res, next) => {
  const document = req.resource;

  // Delete file from filesystem
  if (fs.existsSync(document.path)) {
    fs.unlinkSync(document.path);
  }

  // Delete document record
  await TaxDocument.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Document deleted successfully'
  });
}));

// @desc    Get documents by financial year
// @route   GET /api/documents/year/:financialYear
// @access  Private
router.get('/year/:financialYear', catchAsync(async (req, res, next) => {
  const documents = await TaxDocument.getUserDocuments(req.user._id, req.params.financialYear);

  res.status(200).json({
    success: true,
    count: documents.length,
    data: documents
  });
}));

// @desc    Get document statistics
// @route   GET /api/documents/stats/summary
// @access  Private
router.get('/stats/summary', catchAsync(async (req, res, next) => {
  const stats = await TaxDocument.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: null,
        totalDocuments: { $sum: 1 },
        totalSize: { $sum: '$size' },
        documentsByType: {
          $push: '$documentType'
        },
        processingStats: {
          $push: '$processingStatus'
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        totalDocuments: 0,
        totalSize: 0,
        documentsByType: {},
        processingStats: {}
      }
    });
  }

  const result = stats[0];

  // Count documents by type
  const typeCount = {};
  result.documentsByType.forEach(type => {
    typeCount[type] = (typeCount[type] || 0) + 1;
  });

  // Count processing status
  const statusCount = {};
  result.processingStats.forEach(status => {
    statusCount[status] = (statusCount[status] || 0) + 1;
  });

  res.status(200).json({
    success: true,
    data: {
      totalDocuments: result.totalDocuments,
      totalSize: result.totalSize,
      documentsByType: typeCount,
      processingStats: statusCount
    }
  });
}));

// @desc    Process document (AI analysis)
// @route   POST /api/documents/:id/process
// @access  Private
router.post('/:id/process', validateObjectId, ownerOrAdmin(TaxDocument), catchAsync(async (req, res, next) => {
  const document = req.resource;

  if (document.processingStatus === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Document already processed'
    });
  }

  // Update status to processing
  document.processingStatus = 'processing';
  await document.save();

  // Here you would integrate with AI service for document analysis
  // For now, we'll simulate processing
  try {
    // Simulate AI processing delay
    setTimeout(async () => {
      // Mock extracted data based on document type
      const mockData = generateMockExtractedData(document.documentType);

      // Mock AI analysis
      const aiAnalysis = {
        summary: `Analysis completed for ${document.documentType}`,
        recommendations: ['Review deductions', 'Check for missing documents'],
        confidence: 0.85,
        processedAt: new Date()
      };

      await document.markAsProcessed(mockData, aiAnalysis);
    }, 2000);

    res.status(200).json({
      success: true,
      message: 'Document processing started'
    });
  } catch (error) {
    await document.markAsFailed(error.message);
    return res.status(500).json({
      success: false,
      message: 'Document processing failed'
    });
  }
}));

// Helper function to generate mock extracted data
function generateMockExtractedData(documentType) {
  const baseData = {
    income: { salary: 0, houseProperty: 0, business: 0, capitalGains: 0, otherSources: 0, total: 0 },
    deductions: { section80c: 0, section80d: 0, section24b: 0, other: 0, total: 0 },
    taxPaid: { tds: 0, advanceTax: 0, selfAssessment: 0, total: 0 }
  };

  switch (documentType) {
    case 'form16':
      baseData.income.salary = 1200000;
      baseData.deductions.section80c = 150000;
      baseData.deductions.section80d = 25000;
      baseData.taxPaid.tds = 150000;
      break;
    case 'form26as':
      baseData.taxPaid.tds = 180000;
      break;
    case 'salary_slip':
      baseData.income.salary = 100000; // Monthly
      break;
    default:
      // Random data for other types
      baseData.income.salary = Math.floor(Math.random() * 1000000);
  }

  // Calculate totals
  baseData.income.total = Object.values(baseData.income).reduce((sum, val) => sum + (val || 0), 0) - baseData.income.total;
  baseData.deductions.total = Object.values(baseData.deductions).reduce((sum, val) => sum + (val || 0), 0) - baseData.deductions.total;
  baseData.taxPaid.total = Object.values(baseData.taxPaid).reduce((sum, val) => sum + (val || 0), 0) - baseData.taxPaid.total;

  return baseData;
}

export default router;