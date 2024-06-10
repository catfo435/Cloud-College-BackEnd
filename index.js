const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors') 
const [Student,Instructor,Course] = require('./models/exports.js');
const nodemailer = require("nodemailer");
require('dotenv').config()

const app = express();
const port = 3000;

let corsOptions = { 
  origin : ['http://localhost:5173'],  //put this in env later
}

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 587,
  auth: {
      user: process.env.ZOHO_USERNAME,
      pass: process.env.ZOHO_PWD
  }
})

// Middleware
app.use(cors(corsOptions))
app.use(bodyParser.json()); //limit for request size, the profile picture might be too big and exceed the limit.

//--------- STUDENTS CRUD -------------

// MongoDB connection
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Connection error', err);
});

// Create a new student
app.post('/students', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).send(student);
  } catch (error) {
    console.error(error)
    res.status(400).send(error);
  }
});

// Read all students
app.get('/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).send(students);
  } catch (error) {
    console.error(error)
    res.status(500).send(error);
  }
});

// Read a student by email
app.get('/students/:email', async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.params.email });
    if (!student) {
      return res.status(404).send();
    }
    res.status(200).send(student);
  } catch (error) {
    console.error(error)
    res.status(500).send(error);
  }
});

app.patch('/students/:email/addCourse', async (req, res) => {
  const { email } = req.params;
  const { _id } = req.body;

  try {
    // Check if the course exists
    const course = await Course.findById(_id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Find the student by email and update their course list
    const student = await Student.findOneAndUpdate(
      { email: email },
      { $addToSet: { courses: course._id } }, // Use $addToSet to avoid duplicates
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    try{
      const info = await transporter.sendMail({
        from : process.env.ZOHO_USERNAME,
        to: student.email, // list of receivers
        subject: `CloudCollege : Enrolled in ${course.courseId} : ${course.name} succesfully`, // Subject line
        text: "Your enrollment in the course has been successful. You can now view the course content.", // plain text body
      })
    }
    catch (error){
      console.log(error)
      res.status(200).json({ error: 'An error occurred while sending the confirmation mail' })
    }

    res.status(200).json(student);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'An error occurred while adding the course to the student\'s list.' });
  }
});

app.patch('/students/:email/removeCourse', async (req, res) => {
  const { email } = req.params;
  const { _id } = req.body;

  try {
    // Check if the course exists
    const course = await Course.findById(_id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Find the student by email and update their course list
    const student = await Student.findOneAndUpdate(
      { email: email },
      { $pull: { courses: course._id } }, // Use $addToSet to avoid duplicates
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    try{
      const info = await transporter.sendMail({
        from : process.env.ZOHO_USERNAME,
        to: student.email, // list of receivers
        subject: `CloudCollege : Unenrolled from ${course.courseId} : ${course.name} succesfully`, // Subject line
        text: "You have been unenrolled from the course successfully.", // plain text body
      })
    }
    catch (error){
      console.log(error)
      res.status(200).json({ error: 'An error occurred while sending the confirmation mail' })
    }

    res.status(200).json(student);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'An error occurred while adding the course to the student\'s list.' });
  }
});

//Get all the courses the student is enrolled in
app.get('/students/:email/courses', async (req, res) => { //change this to find by objectid when u store id in localstorage
  try {
    const student = await Student.findOne({ email: req.params.email })
    let courses = await Course.find({"_id":{"$in" : student.courses}})
    
    
    for (let i=0;i<courses.length;i++){
      courses[i] = {...(courses[i])._doc,instructors : await Instructor.find({"_id":{"$in" : courses[i].instructors}})}
    }
    
    if (!student) {
      return res.status(404).send();
    }
    res.status(200).send(courses);
  } catch (error) {
    console.error(error)
    res.status(500).send(error);
  }
})

// Update a student by instituteId
app.patch('/students/:instituteId', async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['email', 'name', 'phone', 'college', 'profile_picture', 'instituteId', 'courses'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const result = await Student.updateOne({ instituteId: req.params.instituteId }, { $set: req.body });

    if (result.n === 0) {
      return res.status(404).send();
    }

    res.status(200).send(result);
  } catch (error) {
    console.error(error)
    res.status(400).send(error);
  }
});

// Delete a student by instituteId
app.delete('/students/:instituteId', async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ instituteId: req.params.instituteId });

    if (!student) {
      return res.status(404).send();
    }

    res.status(200).send(student);
  } catch (error) {
    console.error(error)
    res.status(500).send(error);
  }
});


//--------- INSTRUCTORS CRUD -------------

// Create a new instructor
app.post('/instructors', async (req, res) => {
    try {
      const instructor = new Instructor(req.body);
      await instructor.save();
      res.status(201).send(instructor);
    } catch (error) {
    console.error(error)
      res.status(400).send(error);
    }
  });
  
  // Read all instructors
  app.get('/instructors', async (req, res) => {
    try {
      const instructors = await Instructor.find();
      res.status(200).send(instructors);
    } catch (error) {
    console.error(error)
      res.status(500).send(error);
    }
  });
  
  // Read an instructor by instituteId
  app.get('/instructors/:instituteId', async (req, res) => {
    try {
      const instructor = await Instructor.findOne({ instituteId: req.params.instituteId });
      if (!instructor) {
        return res.status(404).send();
      }
      res.status(200).send(instructor);
    } catch (error) {
    console.error(error)
      res.status(500).send(error);
    }
  });

  app.get('/instructors/:email/courses', async (req, res) => { //change this to find by objectid when u store id in localstorage
    try {
      const instructor = await Instructor.findOne({ email: req.params.email })
      let courses = await Course.find({"_id":{"$in" : instructor.courses}})
      
      for (let i=0;i<courses.length;i++){
        courses[i] = {...(courses[i])._doc,instructors : await Instructor.find({"_id":{"$in" : courses[i].instructors}})}
      }
      
      if (!instructor) {
        return res.status(404).send();
      }
      res.status(200).send(courses);
    } catch (error) {
    console.error(error)
      res.status(500).send(error);
    }
  })
  
  // Update an instructor by instituteId
  app.patch('/instructors/:instituteId', async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['email', 'name', 'profile_picture', 'instituteId'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  
    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }
  
    try {
      const result = await Instructor.updateOne({ instituteId: req.params.instituteId }, { $set: req.body });
  
      if (result.n === 0) {
        return res.status(404).send();
      }
  
      res.status(200).send(result);
    } catch (error) {
    console.error(error)
      res.status(400).send(error);
    }
  });
  
  // Delete an instructor by instituteId
  app.delete('/instructors/:instituteId', async (req, res) => {
    try {
      const instructor = await Instructor.findOneAndDelete({ instituteId: req.params.instituteId });
  
      if (!instructor) {
        return res.status(404).send();
      }
  
      res.status(200).send(instructor);
    } catch (error) {
    console.error(error)
      res.status(500).send(error);
    }
  });


//--------- COURSES CRUD -------------

// Create a new course
app.post('/courses', async (req, res) => {
  try {

    const instructorsExist = await Promise.all(req.body.instructors.map(async (instituteId) => {
      return await Instructor.exists({ _id: instituteId });
    }));

    if (instructorsExist.includes(null)) {
      return res.status(404).send({ error: 'One or more instructors not found' });
    }

    const studentsExist = await Promise.all(req.body.students.map(async (instituteId) => {
      return await Instructor.exists({ _id: instructorId });
    }));

    if (instructorsExist.includes(null)) {
      return res.status(404).send({ error: 'One or more instructors not found' });
    }

    const course = new Course(req.body);
    await course.save();
    res.status(201).send(course);
  } catch (error) {
    console.error(error)
    res.status(400).send(error);
  }
});

// Read all courses
app.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    for (let i=0;i<courses.length;i++){
      courses[i] = {...(courses[i])._doc,instructors : await Instructor.find({"_id":{"$in" : courses[i].instructors}})}
    }
    res.status(200).send(courses);
  } catch (error) {
    console.error(error)
    res.status(500).send(error);
  }
});

// Read a course by id
app.get('/courses/:courseId', async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId });
    if (!course) {
      return res.status(404).send();
    }
    res.status(200).send(course);
  } catch (error) {
    console.error(error)
    res.status(500).send(error);
  }
});

// Update a course by courseId
app.patch('/courses/:courseId', async (req, res) => {

  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'instructors'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {

    const instructorsExist = await Promise.all(req.body.instructors.map(async (instituteId) => {
      return await Instructor.exists({ _id: instituteId });
    }));

    if (instructorsExist.includes(null)) {
      return res.status(404).send({ error: 'One or more instructors not found' });
    }

    const course = await Course.findOneAndUpdate({ courseId: req.params.courseId }, req.body, { new: true });

    if (!course) {
      return res.status(404).send();
    }

    res.status(200).send(course);
  } catch (error) {
    console.error(error)
    res.status(400).send(error);
  }
});

// Add topic to a course by courseId
app.patch('/courses/:courseId/addContent', async (req, res) => {

  try {

    let course = await Course.findOne({ _id: req.params.courseId });
    
    course.content.push(req.body)

    course = await Course.findOneAndUpdate({ _id: req.params.courseId }, {content : course.content}, { new: true });

    if (!course) {
      return res.status(404).send();
    }

    res.status(200).send(course);
  } catch (error) {
    console.error(error)
    res.status(400).send(error);
  }
})

// Delete a course by courseId
app.delete('/courses/:courseId', async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({ courseId: req.params.courseId });

    if (!course) {
      return res.status(404).send();
    }

    res.status(200).send(course);
  } catch (error) {
    console.error(error)
    res.status(500).send(error);
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
