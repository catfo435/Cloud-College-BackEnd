const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required : true
  },
  phone: {
    type: String,
    required: true,
    match: /^[1-9]\d{9}$/
  },
  college: {
    type: String,
    required: true
  },
  profile_picture: {
    type: String,
    required: true
  },
  instituteId: {
    type: String,
    required: true,
    unique: true,
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
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  profile_picture: {
    type: String,
    required: true
  },
  instituteId: {
    type: String,
    required: true,
    unique: true,
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
