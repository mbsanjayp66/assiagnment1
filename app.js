require('dotenv').config();
const express = require('express');
//const formidableMiddleware = require('express-formidable');
const concat = require('concat');
const exphbs  = require('express-handlebars');
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const flash = require('express-flash');
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose = require("passport-local-mongoose");
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const cookieParser = require('cookie-parser');
const cors = require('cors');
//const timestamps = require('mongoose-timestamp');
// const adminRouter = require("./src/routers/admin.router");

const AdminBro = require('admin-bro');
const AdminBroExpress = require('admin-bro-expressjs');
AdminBro.registerAdapter(require('admin-bro-mongoose'));


app.use(express.static("public"));
//app.use(bodyParser.json());

//app.use(formidableMiddleware());
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(session({
   cookie: { maxAge: 60000 },
   secret: "ourlittlesecret",
   resave: false,
   saveUninitialized: true
 }));

 app.use(passport.initialize());
 app.use(passport.session());
 app.use(cookieParser());
 app.use(flash());
 app.use(cors())
 // app.use("/admin",adminRouter);

app.get("/",function(req,res){
  res.render("home");
});
app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/login",function(req,res){
  res.render("login");
});
app.get("/logout",function(req,res){
  res.render("logout");
});

mongoose.connect('mongodb://localhost:27017/registerDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);


const loginSchema = new mongoose.Schema({
logintime:String,
logouttime:String,
});
const Login = new mongoose.model("Login",loginSchema);

const userSchema = new mongoose.Schema({
  name:String,
  phoneNumber:Number,
  address:String,
  city:String,
  pincode:Number,
  state: String,
  country:String,
  username:String,
  password:String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  timeSchedule:[loginSchema],
});

//userSchema.plugin(timestamps);
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// admin

const adminBro = new AdminBro({
  databases: [mongoose],
  rootPath: '/admin',
});
const ADMIN = {
  email:"admin@gmail.com",
  password:"sanjay",
}
const router = AdminBroExpress.buildAuthenticatedRouter(adminBro,{
  authenticate: async (email, password)=>{
    if(email === ADMIN.email && password === ADMIN.password){
      return ADMIN
    }
    return null
  },
  cookieName: 'adminbro',
  cookiePassword: 'somePassword',
});
app.use(adminBro.options.rootPath, router);

app.use(bodyParser.urlencoded({extended:true}));


app.post("/register",function(req,res){
  const login = new Login({
    logintime:new Date(),
  });
  login.save();
  var newUser = new User({
    name:req.body.fname,
    phoneNumber:req.body.mobile,
    address:req.body.address,
    city:req.body.city,
    pincode:req.body.pincode,
    state: req.body.state,
    country:req.body.country,
    username:req.body.username,
    password:req.body.password,
    timeSchedule:login,
  });
  User.register(newUser,req.body.password,function(err,user){
      if(err){
        console.log(err);
        res.redirect("/register");
      }else{
        passport.authenticate("local")(req,res,function(){
          res.render("succes");
        });
      }
    });
  });

// app.post('/register', passport.authenticate('local' , {
// successRedirect : '/succes',
// failuerRedirect : '/register',
// failuerFlash: true
// }));
// passport.use('register', new LocalStrategy({
//   usernameField : 'email',
//   passwordField : 'password',
//   passReqToCallback: true
// }, async (req, email, password, done) => {
//   try {
//          name = req.body.Fname;
//          mobile = req.body.number;
//          address = req.body.address;
//          city = req.body.city;
//          pincode = req.body.pincode;
//          state = req.body.state;
//     const user = await User.create({Fname,number,address,city,pincode,state,email,password});
//     return done(null, user);
//   } catch (error) {
//     done(error);
//   }
// }));










// app.post("/login",function(req,res){
//   const email = req.body.username;
//   const pwd = req.body.password;
//   console.log(email);
//    User.findOne({UserName:email},function(err,foundUser){
//      if(err){
//        console.log(err);
//      }else{
//        if(foundUser){
//          console.log(foundUser);
//             if(foundUser.Password === pwd){
//               console.log(foundUser.createdAt);
//               res.render("succes",{Time:foundUser.createdAt});
//             }else{
//                res.render("wrongPassword");
//             }
//        }
//        else{
//          res.render("failure");
//        }
//      }
//    });
// });
//
//

app.post("/login",function(req,res){

  const user = new User({
    username:req.body.username,
    password:req.body.password
  });
req.login(user,function(err){
  if(err){
    console.log(err);
  }else{
    passport.authenticate("local")(req,res,function(err){
        if(req.isAuthenticated()){
          const lo = new Login({
            logintime:new Date(),
          });
          lo.save();
          var ar = [];
          User.findOne({username:req.body.username},function(err,us){
            if(err){
              console.log(err);
            }else{
              ar = ar.concat(us.timeSchedule);
              ar.push(lo);
              console.log(ar);
              User.updateOne({username:req.body.username},{timeSchedule: ar},function(err,foundUser){
                if(err){
                  console.log(err);
                }else{
                  res.render("succes");
                }
            });
            }
          });
        }
        else{
          res.redirect("login");
        }
    });
  }
});
});

// app.post("/logout",function(req,res){
//     const mail = req.body.username;
//     User.findOne({userName:mail},function(err,foundUser){
//       if(err){
//         console.log(err);
//       }else{
//         if(foundUser){
//           const startingTime = foundUser.createdAt.getTime()/1000;
//           const presentTime = Math.round(new Date().getTime()/1000);
//           const totalTime = Math.round(((presentTime-startingTime)/(60*60))*100)/100;
//           res.render("successfullylogout",{Time:totalTime});
//         }else{
//           res.render("failure");
//         }
//       }
//     });
// });


app.post("/logout",function(req,res){
    const mail = req.body.username;
    User.findOne({username:mail},function(err,foundUser){
      if(err){
        console.log(err);
      }else{
        if(foundUser){
          var sr = [];
          sr = sr.concat(foundUser.timeSchedule);
          const length = foundUser.timeSchedule.length-1;
          sr.pop();
          const logtime = foundUser.timeSchedule[length].logintime;
          const newlogin = new Login({
            logintime:logtime,
            logouttime:new Date()
          });
          newlogin.save();
          sr.push(newlogin);
          User.updateOne({username:mail},{timeSchedule: sr},function(err){
            if(err){
              console.log(err);
            }else{
              req.logout();
              res.render("successfullylogout");
            }
        });
        }else{
          res.render("failure");
        }
      }
    });
});
//


// forgot password

app.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ username: req.body.username }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/login');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: "mbsanjayp66@gmail.com",
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.username,
        from: "mbsanjayp66@gmail.com",
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.username + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/login');
  });
});

app.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/login');
    }
    res.render('reset', {token: req.params.token});
  });
});

app.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: "mbsanjayp66@gmail.com",
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.username,
        from: "mbsanjayp66@gmail.com",
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.username + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        console.log("password changed");
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});


app.listen(3000,function(){
  console.log("running");
});
