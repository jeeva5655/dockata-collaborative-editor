const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  // Unique document ID (used in URLs)
  docId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Document title
  title: {
    type: String,
    default: 'Untitled Document'
  },
  
  // Yjs document state (binary)
  content: {
    type: Buffer,
    default: null
  },
  
  // Document owner (optional - for future auth)
  owner: {
    type: String,
    default: 'anonymous'
  },
  
  // Collaborators who have access
  collaborators: [{
    name: String,
    color: String,
    lastActive: Date
  }],
  
  // Revision history
  revisions: [{
    content: Buffer,
    title: String,
    savedAt: { type: Date, default: Date.now },
    savedBy: String
  }],
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Is document public or private
  isPublic: {
    type: Boolean,
    default: true
  }
});

// Update the updatedAt timestamp before saving
documentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for formatted dates
documentSchema.virtual('createdAtFormatted').get(function() {
  return this.createdAt.toLocaleDateString();
});

documentSchema.virtual('updatedAtFormatted').get(function() {
  return this.updatedAt.toLocaleDateString();
});

// Ensure virtuals are included in JSON
documentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Document', documentSchema);
