const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    match: /^[\w.-]+@[\w.-]+\.\w+$/
  },
  name: {
    first: {
      type: String,
      required: true
    },
    last: {
      type: String,
      required: true
    }
  },
  phone: {
    type: String,
    required: true,
    match: /^\+91[6-9][0-9]{9}$/
  },
  college: {
    type: String,
    required: true
  },
  profile_picture: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  instituteId: {
    type: String,
    required: true,
    unique: true,
    match: /^20\d{2}[A-Z]{2}\d{4}$/
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }]
});

const instructorSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  profile_picture: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  instituteId: {
    type: String,
    required: true,
    unique: true,
    match: /^20\d{2}[A-Z]{3}\d{3}$/
  }
});

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  courseId: {
    type: String,
    required: true,
    match: /^[A-Z]{3,4} F\d{3}$/
  },
  instructors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor'
  }]
});


const Student = mongoose.model('students', studentSchema);
const Instructor = mongoose.model('instructors', instructorSchema);
const Course = mongoose.model('courses', courseSchema);

module.exports = [Student,Instructor,Course];
