require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  "mongodb+srv://aadarsh:test-123@cluster0.4ryob.mongodb.net/blogDB"
);
const blogschema = new mongoose.Schema({
  title: String,
  post: String,
});
const userschema = new mongoose.Schema({
  username: String,
  password: String,
  blogs: [blogschema],
});
userschema.plugin(passportLocalMongoose);
const Blog = mongoose.model("Blog", blogschema);
const User = mongoose.model("User", userschema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
const homeStartingContent =
  "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent =
  "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent =
  "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

app.get("/", function (req, res) {
  res.render("home");
});
app.get("/login", function (req, res) {
  res.render("login");
});
app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/home");
    }
  });
});
app.get("/register", function (req, res) {
  res.render("register");
});
app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/home");
        });
      }
    }
  );
});
app.get("/home", function (req, res) {
  if (req.isAuthenticated()) {
    const userID = req.user.id;
    User.findById(userID, function (err, foundUser) {
      if (!err) {
        res.render("home2", {
          text: homeStartingContent,
          content: foundUser.blogs,
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});
app.get("/about", function (req, res) {
  res.render("about", { text: aboutContent });
});
app.get("/contact", function (req, res) {
  res.render("contact", { text: contactContent });
});
app.get("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("compose");
  } else {
    res.redirect("/login");
  }
});
app.get("/posts/:id", function (req, res) {
  if (req.isAuthenticated()) {
    let id = req.params.id;
    Blog.findOne({ _id: id }, function (err, result) {
      if (!err) {
        res.render("post", { title: result.title, content: result.post });
      } else {
        console.log("not found");
      }
    });
  } else {
    res.redirect("/login");
  }
});
app.post("/compose", function (req, res) {
  const blog = new Blog({
    title: req.body.title,
    post: req.body.post,
  });
  blog.save();
  User.findById(req.user.id, function (err, foundUser) {
    if (!err) {
      foundUser.blogs.push(blog);
      foundUser.save();
      res.redirect("/home");
    }
  });
});
app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});
app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
