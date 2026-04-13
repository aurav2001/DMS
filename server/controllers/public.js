const Document = require('../models/Document');
const User = require('../models/User');

const getPublicData = async (req, res) => {
    try {
        const { search } = req.query;

        // Base query for public documents
        const query = { accessLevel: 'public', isDeleted: false };
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        // Fetch documents
        const documents = await Document.find(query)
            .select('-fileData') // Exclude heavy buffer data
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 });

        // Calculate statistics for the badges
        // 1. Total Public Documents
        const totalDocuments = await Document.countDocuments({ accessLevel: 'public', isDeleted: false });
        
        // 2. Total Contributing Users (users who uploaded at least one public doc)
        const uniqueIssuers = await Document.distinct('uploadedBy', { accessLevel: 'public', isDeleted: false });
        const totalIssuers = uniqueIssuers.length;

        // 3. Total Departments/Categories (Using unique Tags)
        const uniqueTags = await Document.distinct('tags', { accessLevel: 'public', isDeleted: false });
        const totalDepartments = uniqueTags.length;

        res.json({
            documents,
            stats: {
                totalDocuments,
                totalIssuers,
                totalDepartments
            }
        });

    } catch (err) {
        console.error('Public Data Error:', err);
        res.status(500).json({ message: 'Error fetching public data' });
    }
};

module.exports = { getPublicData };
