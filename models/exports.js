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
  }],
  wallet: { 
    type: Number,
    default: 0,
    min: 0 
  }
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
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }]
});

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    description: "The name of the course. Must be a string."
  },
  courseId: {
    type: String,
    required: true,
    unique: true,
    description: "The unique identifier of the course. Must follow the format XXX FYYY or XXXX FYYY."
  },
  price : {
    type : Number,
    required : true
  },
  instructors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor',
    required: true,
    description: "An array of ObjectIds referencing the instructors teaching the course."
  }],
  content: [{
    heading: {
      type: String,
      required: true,
      description: "The heading of the content. Must be a string."
    },
    description: {
      type: String,
      required: true,
      description: "The description of the content. Must be a string."
    },
    file: {
      type: String,
      description: "The base64-encoded string of the content file. This field is optional."
    }
  }],
  roomId: { type: String}
});


const Student = mongoose.model('students', studentSchema);
const Instructor = mongoose.model('instructors', instructorSchema);
const Course = mongoose.model('courses', courseSchema);

module.exports = [Student,Instructor,Course];
