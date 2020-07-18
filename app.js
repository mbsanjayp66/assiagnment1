require('dotenv').config();
const express = require('express');
const formidableMiddleware = require('express-formidable');
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
const timestamps = require('mongoose-timestamp');
// const adminRouter = require("./src/routers/admin.router");

const AdminBro = require('admin-bro');
const AdminBroExpress = require('admin-bro-expressjs');
AdminBro.registerAdapter(require('admin-bro-mongoose'));


app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(formidableMiddleware());
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

app.all('/express-flash', function( req, res ) {
    req.flash('success', 'This is a flash message using the express-flash module.');
    res.redirect(301, '/');
});

mongoose.connect('mongodb://localhost:27017/registerDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  username:String,
  password:String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  },
  {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }}
);
userSchema.plugin(timestamps);
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
      if(err){
        console.log(err);
        res.redirect("/register");
      }else{
        passport.authenticate("local")(req,res,function(){
          res.render("succes",{Time:user.createdAt});
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
    passport.authenticate("local")(req,res,function(){
      res.render("succes",{Time:user.createdAt});
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
    User.findOne({UserName:mail},function(err,foundUser){
      if(err){
        console.log(err);
      }else{
        if(foundUser){
          const startingTime = foundUser.createdAt.getTime()/1000;
          const presentTime = Math.round(new Date().getTime()/1000);
          const totalTime = Math.round(((presentTime-startingTime)/(60*60))*100)/100;
            req.logout();
          res.render("successfullylogout",{Time:totalTime});
        }else{
          res.render("failure");
        }
      }
    });
});
//
// admin

const adminBro = new AdminBro({
  databases: [mongoose],
  rootPath: '/admin',
});
const router = AdminBroExpress.buildRouter(adminBro);
 app.use(adminBro.options.rootPath, router);
const ADMIN = {
  email:"admin@gmail.com",
  password:"sanjay",
}
// const router = AdminBroExpress.buildAuthenticatedRouter(adminBro,{
//   authenticate: async (email, password)=>{
//     if(email === ADMIN.email && password === ADMIN.password){
//       return ADMIN
//     }
//     return null
//   },
//   cookieName: 'adminbro',
//   cookiePassword: 'somePassword',
// });
// app.use(adminBro.options.rootPath, router);

// forgot password

app.post("/forgot",function(req,res,next){
  async.waterfall([
    function(done){
      crypto.randomBytes(20,function(err,buf){
       var token = buf.toString("hex");
        done(err,token);
      });
    },
    function(token,done){
      User.findOne({username: req.body.username},function(err,user){
        if(!user){
          req.flash("error","No account with that email address exist.");
          return res.redirect("/login");
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now()+3600000;//1 hour;
        user.save(function(err){
          done(err,token,user);
        });
      });
    },
    function(token,user,done){
      var smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth:{
          user:"mbsanjayp66@gmail.com",
          pass:process.env.GMAILPW
        }
      });

      var mailOptions = {
        to:user.username,
        from:"mbsanjayp66@gmail.com",
        subject:"Node.js Password Reset",
        text:'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'

      };
      smtpTransport.sendMail(mailOptions,function(err){
        console.log("mail sent");
        req.flash("succes","An email has been sent to"+ user.username +"with further instruction")
        done(err,"done");
      });
    }
  ],function(err){
    if(err){
      return next(err);
      res.redirect("/")
    }
  });
});

app.get("/reset/:token",function(req,res){
  User.findOne({resetPasswordToken:req.params.token,resetPasswordExpires: {$gt:Date.now()}},function(err,user){
    if(!user){
      req.flash("error","password reset token is invalid");
      return res.redirect("/");
    }
    res.render("reset",{token:req.params.token});
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
          user: 'mbsanjayp66@gmail.com',
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
