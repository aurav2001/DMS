const Document = require('../models/Document');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { downloadFromSFTP } = require('../utils/sftp');

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
const viewPublicDocument = async (req, res) => {
    try {
        const document = await Document.findOne({ _id: req.params.id, accessLevel: 'public', isDeleted: false });
        if (!document || !document.fileData) {
            return res.status(404).json({ message: 'Public file not found' });
        }

        // Enforce View permission if toggled by admin
        if (document.permissions?.canView === false) {
            return res.status(403).json({ message: 'Public viewing for this document is restricted by administrator' });
        }
        
        res.set({
            'Content-Type': document.fileType,
            'Content-Disposition': `inline; filename="${document.fileName || 'view'}"`,
        });

        if (document.storageType === 'local' && document.storagePath) {
            const filePath = path.join(__dirname, '../uploads', document.storagePath);
            if (fs.existsSync(filePath)) {
                res.set('Content-Length', document.fileSize);
                return fs.createReadStream(filePath).pipe(res);
            }
        } else if (document.storageType === 'sftp' && document.storagePath) {
            const data = await downloadFromSFTP(document.storagePath);
            res.set('Content-Length', data.length);
            return res.send(data);
        }

        if (!document.fileData) return res.status(404).json({ message: 'File data not found' });
        res.set('Content-Length', document.fileData.length);
        res.send(document.fileData);
    } catch (err) {
        console.error('View Public Document Error:', err);
        res.status(500).json({ message: 'Error viewing document' });
    }
};

const sendContactEmail = async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'Please provide all fields' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false // Helps in some restrictive environments
            }
        });

        const mailOptions = {
            from: `"DocVault Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.CONTACT_RECEIVER_EMAIL,
            replyTo: email,
            subject: `Contact Form: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e1e1; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center;">
                        <h2 style="margin: 0; font-size: 24px;">New Contact Inquiry</h2>
                        <p style="margin: 5px 0 0; opacity: 0.8;">You have received a new message from ${name}</p>
                    </div>
                    <div style="padding: 30px; line-height: 1.6; color: #374151;">
                        <div style="margin-bottom: 20px;">
                            <p style="margin: 0; color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase;">From</p>
                            <p style="margin: 4px 0; font-size: 16px;"><strong>${name}</strong> (${email})</p>
                        </div>
                        <div style="margin-bottom: 25px;">
                            <p style="margin: 0; color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase;">Subject</p>
                            <p style="margin: 4px 0; font-size: 16px;">${subject}</p>
                        </div>
                        <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #4f46e5;">
                            <p style="margin: 0; color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Message</p>
                            <div style="font-size: 15px; color: #1f2937; white-space: pre-wrap;">${message}</div>
                        </div>
                    </div>
                    <div style="background-color: #f9fafb; color: #9ca3af; padding: 15px; text-align: center; font-size: 11px; border-top: 1px solid #f3f4f6;">
                        This email was sent from the DocVault Contact Form securely via NodeMailer.
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Message sent successfully' });

    } catch (err) {
        console.error('Nodemailer Critical Error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Error sending message. Please ensure backend environment variables are set correctly.',
            error: err.message
        });
    }
};

module.exports = { getPublicData, viewPublicDocument, sendContactEmail };
