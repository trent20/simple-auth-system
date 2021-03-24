const express = require('express');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const matchCredentials = require('./utils');
const fake_db = require('./db')

const app = express();
let loginErrors = '';
let regErrors = '';


app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(express.urlencoded({extended: false}));
app.use(express.static(__dirname + '/public'))

// home page with forms
app.get('/', function (req, res) {
  res.render('pages/home', {error: regErrors, lError: loginErrors})
  console.log(req.cookies)
})

//create user account
app.post('/create', function (req, res) {
  let username= req.body.username
  let password= req.body.password

  let uLength = username.length
  let pLength  = password.length
  
  if(uLength === 0 && pLength === 0){
    regErrors = 'Please fill in required fields'
  } else if (uLength === 0){
      regErrors = 'Please fill in username'
  } else if(pLength < 8){
      regErrors = 'Enter minimum number of characters for password'
  } else {
    if(uLength > 0 && pLength >= 8 ){
      regErrors = ''
      user = {
        username: username,
        password: password
      }
      console.log(user)  
    } else {
      regErrors = "Unable to create user"
    }
  }
  if(regErrors.length === 0){
    fake_db.users[user.username] = user
  }

  console.log(fake_db)
  res.render('pages/home', {error: regErrors, lError: loginErrors}  )
})

//login
app.post('/login', function(req, res) {
  let username= req.body.username
  let password= req.body.password
  let uLength = username.length
  let pLength  = password.length

  if(uLength === 0 && pLength === 0){
    loginErrors = 'Please fill in required fields'
  } else if (uLength === 0){
    loginErrors = 'Please fill in username'
  } else if(pLength < 8){
    loginErrors = 'Enter minimum number of characters for password'
  } else {
    loginErrors = '';
    if(uLength > 0 && pLength >= 8 ){
      if(matchCredentials(req.body)) {
        let user = fake_db.users[username]
        let id = uuidv4();
        
        console.log(user)

        fake_db.sessions[id] = {
          user: user,
          timeOfLogin: Date.now()
        }
    
        //create cookie that holds UUID (Session ID)
        res.cookie('SID', id, {
          expires: new Date(Date.now() + 90000),
          httpOnly: true
        })
    
        res.render('pages/home',{user: fake_db.users[username], lError: loginErrors, error: regErrors})
      } else {
        res.redirect('/error')
      } 
    } else {
     loginErrors = 'Unable to login in'
    }

    res.render('pages/home',{user: fake_db.users[username], lError: loginErrors, error: regErrors}  )

    console.log(fake_db)
  }
})

//protected route
app.get('/supercoolmembersonlypage', function(req, res) {
  let id = req.cookies.SID

  let session = fake_db.sessions[id]
  
  if(session){
    res.render('pages/members',{user: session.user, error: regErrors, loginErrors: loginErrors })
  } else {
    res.render('pages/error')
  }

  console.log(fake_db)
})

//if something went wrong, you get sent here
app.get('/error', function(req, res) {
  res.render('pages/error')
})

//logout
app.get('/logout', function(req, res) {
  let id = req.cookies.SID

  let sesh = fake_db.sessions[id]

  if(sesh){
    delete fake_db.sessions[id]
    res.cookie('SID','', {
      expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT'),
      httpOnly: true
    })
  }
  console.log(fake_db)
  res.redirect('/')
})

app.all('*', function(req, res) {
  res.render('pages/error')
})

const PORT = process.env.port || 1612

app.listen(PORT, () => {
  console.log(`Server is running on port:${PORT}`)
})