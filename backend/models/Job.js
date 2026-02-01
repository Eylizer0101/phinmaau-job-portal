const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published'
    },

    title: {
        type: String,
        required: function () { return this.isPublished === true; },
        trim: true
    },
    description: {
        type: String,
        required: function () { return this.isPublished === true; }
    },
    requirements: {
        type: String,
        required: function () { return this.isPublished === true; }
    },
    jobType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid'],
        required: function () { return this.isPublished === true; }
    },

    // ✅ UPDATED: category now supports EmployerRegisterPage industries
    category: {
        type: String,
        required: function () { return this.isPublished === true; },
        enum: [
            'Accounting',
            'Advertising & Marketing',
            'Agriculture',
            'Architecture',
            'Automotive',
            'Banking & Finance',
            'Construction',
            'Education',
            'Energy & Utilities',
            'Engineering',
            'Food & Beverage',
            'Government',
            'Healthcare',
            'Hospitality & Tourism',
            'Human Resources',
            'Information Technology',
            'Legal',
            'Logistics & Supply Chain',
            'Manufacturing',
            'Media & Entertainment',
            'Real Estate',
            'Retail',
            'Security',
            'Telecommunications',
            'Transportation',
            'Others',
        ]
    },

    salaryMin: {
        type: Number,
        min: 0
    },
    salaryMax: {
        type: Number,
        min: 0
    },
    salaryType: {
        type: String,
        enum: ['Monthly', 'Yearly', 'Hourly', 'Project-based'],
        default: 'Monthly'
    },
    location: {
        type: String,
        required: function () { return this.isPublished === true; }
    },
    workMode: {
        type: String,
        enum: ['On-site', 'Remote', 'Hybrid'],
        required: function () { return this.isPublished === true; }
    },
    applicationDeadline: {
        type: Date,
        required: function () { return this.isPublished === true; }
    },
    vacancies: {
        type: Number,
        required: function () { return this.isPublished === true; },
        min: 1
    },
    skillsRequired: [{
        type: String,
        trim: true
    }],

    experienceLevel: {
        type: String,
        enum: [
            'Internship',
            'Entry Level',
            'Junior',
        ],
        default: 'Entry Level'
    },

    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    companyLogo: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },

    isPublished: {
        type: Boolean,
        default: true
    },

    views: {
        type: Number,
        default: 0
    },
    applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application'
    }],
    applicationCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

jobSchema.index({ title: 'text', description: 'text', category: 'text' });
jobSchema.index({ employer: 1, createdAt: -1 });
jobSchema.index({ isActive: 1, isPublished: 1 });

module.exports = mongoose.model('Job', jobSchema);
