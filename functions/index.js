
//Useful Firebase commands
//firebase deploy --only functions

const functions = require("firebase-functions");
const express = require("express");
const app = express();
const admin = require("firebase-admin");
const uuid = require('uuid');
const nodemailer = require("nodemailer");
admin.initializeApp();

const uAmount = 20;
const isRedeemedFlag = false;
const isApplicableFlag = false;
let transporter = null;

const Stripe = require("stripe");
const stripe = Stripe(
  "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"
);

const cors = require("cors");
app.use(cors());









app.post("/connection_token", async (req, res) => {
  const token = res.json({ secret: token.secret }); // ... Fetch or create the ConnectionToken
});
app.post("/create_customer", async (req, res) => {
  if (req.body.email != null) {
    const customer = await stripe.customers.create({
      email: req.body.email,
    });

    if (customer != null && customer.id != null) {
      res.json({ customer: customer.id, status: "success" });
    } else {
      res.json({
        msg: "Please contact admin. Unable to create customer.",
        status: "failure",
      });
    }
  } else {
    res.json({ msg: "Please provide email", status: "failure" });
  }
});

app.post("/ephemeralKey", async (req, res) => {
  if (req.body.api_version == null || req.body.customer_id == null) {
    res.json({ msg: "Unable to create emhemeral key.", status: "failure" });
  } else {
    let key = await stripe.ephemeralKeys.create(
      { customer: req.body.customer_id },
      { apiVersion: req.body.api_version }
    );
    if (key != null) res.json({ data: key });
    else {
      res.json({ msg: "Unable to create emhemeral key.", status: "failure" });
    }
  }
});


app.get("/apidata", (req, res) => {
  const date = new Date();
  const hours = (date.getHours() % 12) + 1; // London is UTC + 1hr;
  res.json({ msg: "hello world" });
});


app.get('/create-checkout-session', async (req, res) => {

  if (req.query.price_id != null && req.query.mode != null) {
    await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: req.query.price_id,
          quantity: 1,
        },
      ],
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      mode: req.query.mode,
    }).then(
      function (result) {
        res.json({ msg: "Success", status: "success", session: result });
      },
      function (err) {
        res.json({ msg: "error", status: "error", session: err });
      }
    );



  } else {
    if (req.query.price_id == null)

      return { success: false, msg: 'Please provide Price ID' };
    else
      return { success: false, msg: 'Please provide Payment mode' };
  }

  res.redirect(303, session.url);
});
app.get("/account", async (req, res) => {
  // const account = await stripe.accounts.create({ type: "express" });
  // res.json({ account: account});
  // try {

  const account = await stripe.accounts.create({
    country: 'US',
    type: 'express',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',

    business_profile: { product_description: 'Tellzme will use this account url to transfer payments into the Contractor account. Contractor will be providing services to the clients and will get paid using stripe.' },
  });



  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: 'https://example.com/reauth',
    return_url: 'https://example.com/success',
    type: 'account_onboarding',
  });


  res.json({ account: account, link: accountLink });

});

app.post("/sendFCM", async (req, res) => {
  var isSuccess = false;
  if (
    req.body.tokens == null ||
    req.body.tokens.length == 0 ||
    req.body.msg == null ||
    req.body.title == null
  ) {
    if (req.body.title == null)
      res.json({ msg: "Msg Title Required", status: "failure" });
    if (req.body.msg == null)
      res.json({ msg: "Message Required", status: "failure" });
    if (req.body.tokens == null)
      res.json({ msg: "FCM Tokens Required", status: "failure" });
    if (req.body.tokens.length == 0)
      res.json({ msg: "FCM Tokens Required", status: "failure" });
  } else {
    req.body.tokens.forEach((element) => {
      if (element != "") {
        const payload = {
          token: element,
          notification: {
            title: req.body.title,
            body: req.body.msg,
          },
          data: {
            link: req.body.data,
          },
        };

        admin
          .messaging()
          .send(payload)
          .then((response) => {
            // Response is a message ID string.
            console.log("Successfully sent message:", response);
            isSuccess = true;
            // return { success: true };
          })
          .catch(function (error) {
            console.log("Notification sent failed:", error);
            isSuccess = false;
            // res.json({ msg: "Notification sent failed", status: "failure" });
            // return { success: false };
          });
      } else {
        isSuccess = false;
      }
    });

  }

  if (isSuccess == true) {
    res.json({ msg: "Success", status: "success" });
  } else {
    res.json({ msg: "Failed", status: "failed" });
  }
  return { success: true };
});
app.post("/createPaymentIntent", async (req, res) => {
  if (req.body.amount == null || req.body.customer_id == null) {
    res.json({ msg: "Amount Required", status: "failure" });
  } else {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "usd",
    });
    const clientSecret = paymentIntent.client_secret;

    const data = { paymentIntent: paymentIntent, clientSecret: clientSecret };

    res.json({ data: data });
  }
});




app.post("/refund", async (req, res) => {
  if (req.body.amount == null || req.body.payment_intent == null) {
    res.json({ msg: "Amount and Payment Intent Required", status: "failure" });
  } else {

    const refund = await stripe.refunds.create({
      payment_intent: eq.body.payment_intent,
      amount: req.body.amount,
    });

    res.json({ data: refund });
  }
});

app.post("/payout", async (req, res) => {
  if (req.body.amount == null || req.body.stripe_account_id == null) {
    res.json({ msg: "Amount and Stripe Account ID Required", status: "failure" });
  } else {

    const payout = await stripe.payouts.create({
      amount: req.body.amount,
      currency: 'usd',
    }, {
      stripeAccount: req.body.stripe_account_id,
    });

    res.json({ data: payout });
  }
});


app.post("/createBrandAmbassador", async (req, res) => {
  if (req.body.regNumber == null
    || req.body.isAnualFee == null
    || req.body.status == null
    || req.body.directRetailer == null
    || req.body.year == null
    || req.body.uid == null

  ) {
    res.json({ msg: "All params are required", status: "failure" });
  } else {

    const data = {
      regNumber: req.body.regNumber,
      createdAt: Date.now(),
      isAnualFee: req.body.isAnualFee,
      status: req.body.status,
      directRetailer: req.body.directRetailer,
      year: req.body.year,
      uid: req.body.uid

    };
    var doc = admin.firestore()
      .collection("brandAmbassador")
      .doc(data.uid)
      .set(data)
      .then((d) => {
        console.log("brandAmbassador created:\n" + d);
      });

    res.json({ data: doc });
  }
});

// CALL BACK FUNCTIONS

// app.post("/callfunction", async (req, res) => {

//   this.senddevices();
//     res.json({ data: "called function" });

// });

//Triggered when user is created
exports.referralUserCreated = functions.firestore
  .document("user/{documentId}")
  .onCreate((snap, context) => {
    const refCode = snap.get("referralCode");
    const creAt = snap.get("createdAt");
    const userId = snap.get("uid");

    const data = {
      referralCode: refCode,
      createdAt: creAt,
      amount: uAmount,
      isApplicable: isApplicableFlag,
      isRedeemed: isRedeemedFlag

    };
    return admin.firestore()
      .collection("userReferences")
      .doc(userId)
      .set(data)
      .then((d) => {
        console.log("userPrefrencesSucessfully" + d);
      });
  });

//Triggered when adminPayment is created 
exports.paymentListner = functions.firestore
  .document("purchases/{documentId}")
  .onCreate((snap, context) => {
    const uId = snap.get("userId");
    const timeStamp = snap.get("createdAt");
    const directRetailerId = snap.get("retailerId");
    const isDirectRetailerPurchase = snap.get("isDirectRetailerPurchase");
    const packageType = snap.get("packageType");

    const data = {
      isApplicable: true,
      applicableFrom: timeStamp
    };
    return admin.firestore()
      .collection("userReferences")
      .doc(uId)
      .update(data)
      .then((d) => {
        console.log("Operation Successful" + d);
      });


  });



//Triggered when isQualifiedForWholeSaler becomes true in Retailer then send Email To Admin
exports.retailerUpdated = functions.firestore
  .document("retailer/{documentId}")
  .onUpdate((change, context) => {
    console.log("retailer context:" + context);
    // Get an object representing the document
    // e.g. {'name': 'Marie', 'age': 66}
    const retailerAfter = change.after.data();

    // ...or the previous value before this update
    const retailerBefore = change.before.data();

    // access a particular field as you would any JS property

    if (retailerBefore.isQualifiedForWholesaler != true && retailerAfter.isQualifiedForWholesaler) {
      sendWholesalerQualifiedEmail(retailerAfter.email);
    }

    // isActivated = true is done from payment successfull pages in Application
    // When retailer is Registered and Activated then 
    if (retailerBefore.isActivated != true && retailerAfter.isActivated) {
      admin.firestore().collection('user').where('uid', '==', retailerAfter.uid).get()
        .then((snapshot) => {
          if (snapshot.empty) {
            console.log('No matching documents.');

          } else {
            console.log("retailer user snapshot: " + snapshot);
            //New retailer user's directRetailer under which he is registered
            const directRetailer = snapshot[1].directRetailer;


            admin.firestore()
              .collection('user')
              .where('directRetailer', '==', directRetailer)
              .where('isRetailer', '==', true)
              .where('isAdmin', '==', true)
              .get()
              .then((snapshot) => {
                if (snapshot.empty) {
                  console.log('No matching documents.');

                } else if (snapshot.length >= 2) {
                  console.log('isQualifiedForWholesaler shoul be true');

                  //This will cause this listener to call again and first if condition will run to send email
                  admin.firestore()
                    .collection("retailer")
                    .doc(directRetailer)
                    .update({isQualifiedForWholesaler: true})
                    .then((d) => {
                      console.log("Operation Successful" + d);
                    });
                  // return change.after.ref.set({
                  //   isQualifiedForWholesaler: true
                  // }, { merge: true });
                  // snapshot.forEach(doc => {
                  //   console.log(doc.id, '=>', doc.data());
                  // });
                }
              });
          }
        });




    }

    // perform desired operations ..
  });

// Trigger every minute
exports.triggerAfterEveryOneMinute = functions.pubsub.schedule('*/5 * * * *').onRun((context)=>{

  sendEmailAfterThreeDays();
  deleteUnVerifiedUsersAfterSevenDays();
  
  
  admin.firestore().collection("scheduleNotifications")
  .where("scheduleAt", "<=", Date.now())
  .get().then((snapshot) => {

    snapshot.forEach(doc => {
      if(doc.exists){
        const data = doc.data();
        console.log(doc.id, '<=', doc.data());

        const url = 'https://qr-code.page?type=newsfeed&newsfeed-id='+data.newsFeedId;
        
        data.to.forEach((element) => {
          if (element != "") {
            const payload = {
              token: element,
              notification: {
                title: data.title,
                body: data.body,
              },
              data: {
                link: url,
              },
            };
    
            admin
              .messaging()
              .send(payload)
              .then((response) => {
                // Response is a message ID string.
                console.log("Successfully sent message:", response);
                // return { success: true };
              })
              .catch(function (error) {
                console.log("Notification sent failed:", error);
              });
          } 
        });
        
        admin.firestore()
                    .collection("newsfeed")
                    .doc(data.newsFeedId)
                    .collection("news")
                    .doc(data.newsId)
                    .update({isSetTriggerDate: false,
                      isSent: true});
        admin.firestore().collection("scheduleNotifications").doc(doc.id).delete();              

      }
    });
  });

  console.log("Hello im printing after every 1 minute");
  return null;
});


function sendEmailAfterThreeDays() {

  admin.firestore().collection("newlyCreatedUsers")
  .where("resendVerificationEmailDate", "<=", Date.now())
  .get().then((snapshot) => {
    
    
    snapshot.forEach(async (element) => {
      const data = element.data();

    OTP = data.otp;
    let testAccount = await nodemailer.createTestAccount();

    var emailTemplate = '<html xmlns="http://www.w3.org/1999/xhtml">'
    +'<head>'
    +'<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'
    +'<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">'
    +'<title>Many thanks for your registration</title>'
    +'<style type="text/css">'
    
    +'@font-face {'
    +'font-family: \'Icons Technology Template\';'
    +'src: url(\'https://assets.website-files.com/635006df15081fdeda1bbe4f/635006df15081f62be1bbeed_icons-technology-template.woff2\')format(\'woff2\');'
    +'font-weight: 400;'
    +'font-style: normal;'
    +'font-display: swap;'
    +'}'
    +'@font-face {'
    +'font-family: \'Plus Jakarta Display\';'
    +'src: url(\'https://assets.website-files.com/635006df15081fdeda1bbe4f/635006df15081f3e891bbeb1_PlusJakartaDisplay-Medium.otf\') format(\'opentype\');'
    +'font-weight: 500;'
    +'font-style: normal;'
    +'font-display: swap;'
    +'}'
    +'@font-face {'
    +'font-family: \'Plus Jakarta Display\';'
    +'src: url(\'https://assets.website-files.com/635006df15081fdeda1bbe4f/635006df15081f50301bbecf_PlusJakartaDisplay-Regular.otf\') format(\'opentype\');'
    +'font-weight: 400;'
    +'font-style: normal;'
    +'font-display: swap;'
    +'}'
    
    
    +'.preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; }'
    +'.column {padding-bottom: 20px;}'
    
    +'@font-face {'
    +'font-family: \'Open Sans\', Arial, Helvetica, sans-serif;'
    +'font-style: normal;'
    +'font-weight: 400;'
    +'}'
    
    +'img {display:block;}'
    
    +'p,td, ul, li{'
    +'font-family: \'Open Sans\', Arial, Helvetica, sans-serif;'
    +'color:#00000; line-height: 1.3em; font-size:1.0em;  }'
    
    +'p.subtitle{'
    +'font-family: \'Open Sans\', Arial, Helvetica, sans-serif;'
    +'color:#a0a0a0; line-height: 1.15em; font-size:1.0em;  }'
    
    +'p.impressum{'
    +'font-family: \'Open Sans\', Arial, Helvetica, sans-serif;'
    +'color:#a0a0a0; font-weight:300; line-height: 1.2em; font-size:0.8em;  }'
    
    +'a{'
    +'font-family: \'Open Sans\', Arial, Helvetica, sans-serif; font-weight:normal;   font-size:1em;   margin-top:20px; text-decoration:underline; color:#0144e4;}'
    
    +'a.weiterlesen{font-family: \'Open Sans\', Arial, Helvetica, sans-serif;    font-size:1.05em;     font-weight:bold;     text-decoration:underline;    color:#0144e4;   }'
    
    +'a.headline{font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  font-weight:bold;   line-height:1.2em;  text-decoration:none;  color:#0144e4;  font-size: 1.2em;  padding-bottom:1em; }'
    
    +'h1{  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  font-weight:bold;   line-height:1.2em;  text-align:middle;  color:#000000;   font-size: 1.4em;}'
    
    +'h2{  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  font-weight:bold;   font-size: 1.3em;  line-height:1.2em;  text-align:middle;  color:#0144e4;  }'
    
    +'h3{  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  font-weight:bold;   line-height:1.3em;  text-align:middle;  color:#0144e4;   font-size: 1.3em;}'
    
    +'hr {border-top: 1px;color: #e7e7e7;}'
    
    +'tr.grey{background-color: #f2f2f2;border: 1px;border-color: #000000; }'
    
    +'a.link {  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  font-size: 0.9em;   font-weight: normal;  color:#0144e4;  line-height: 1.1;   text-decoration: none;   }'
    
    
    +'a.link:hover { text-decoration: underline;   }'
    
    
    +'a.button-a {  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  background: #0144e4;   border: 15px solid #0144e4;   font-size: 1em;   font-weight: bold;  color:#FFFFFF;  line-height: 1.1;   text-align: center;   text-decoration: none;   display: block; border-radius: 3px;  }'
    
    
    +'a.button-a:hover {  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  font-size: 1em;   font-weight: bold;  color:#0144e4;   background: #2E9AFE !important;  border-color: #2E9AFE !important;  }'
    
    +'a.button-b {  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  background: #cccccc;   border: 15px solid #cccccc;   font-size: 1em;   font-weight: bold;  color:#FFFFFF;  line-height: 0.9;   text-align: center;   text-decoration: none;   display: block; border-radius: 3px; }'
    
    
    +'a.button-b:hover {  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  font-family:arial,verdana,helvetica;  font-size: 0.95em;   font-weight: bold;  color:#FFFFFF;     background: #999999 !important; border-color: #999999 !important;}'
      
    +'@media only screen and (max-width: 640px) {'
    +'.deviceWidth {'
    +'padding: 0;'
    +' }'

    +'.center {text-align: center!important;width: 100%;}'
    +'}'
    
    +'@media only screen and (max-width: 479px) {'
    +'.deviceWidth {'
    +'width: 280px!important;'
    +'padding: 0;'
    +'}'
    +'}'
    
        +'</style>'
        +'</head>'
        +'<body style="margin-top:10px;" bgcolor="#F8F8F8" leftmargin="0" topmargin="100px" marginwidth="0" marginheight="0">'
        +'<span class="preheader" style="display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;"> '
        +'Please confirm your identity</span>'
        +'<table style="width: 100%;" cellspacing="0" cellpadding="0" border="0" bgcolor="#F8F8F8">'
        +'<tbody>'
        +'<tr>'
        +'<td align="center">'
    
        +'<table class="deviceWidth" style="width: 600px;" cellspacing="0" cellpadding="0" border="0" bgcolor="#F8F8F8">'
        +' <tbody>'
        +'<tr>'
        +'<td colspan="2">'
        +'<table style="width: 100%;">'
        +'<tbody>'
        +'<tr>'
        +'<td height="20px" colspan="4">'
        +'&nbsp;'
        +'</td>'
        +'</tr>'
    
        +'<tr>'
        +'<td style="Padding-left:5px; padding-right:20px;" width="100px" align="left">'
        +'<a href="https://www.tellz.me" target="_blank">'
        +'<img class="deviceWidth " style="width: 100px!important;"'
        +'src="https://firebasestorage.googleapis.com/v0/b/tmpage-4a311.appspot.com/o/1-user_documents%2Fezgif.com-gif-maker.png?alt=media&token=d399ee57-f417-4e76-b3cb-ee30bb8b301b"/>'
        +'</a>'			
        +'</td>'
        +'<td width="450px" colspan="3">'
        +'</td>'
                  
        +'</tr>'

        +'<tr>'
        +'<td height="40px" colspan="4">'
        +'&nbsp;'
        +'</td>'
        +'</tr>'
 
        +'<tr>'
        +'<td colspan="2"style="padding-left: 20px; padding-right: 20px;background: #F8F8F8F8;" width="300px">'
        +'<a href="https://www.tellz.me" target="_blank">' 
                    
        +'<img class="deviceWidth " style="width: 180px!important;"' 
        +'src="https://firebasestorage.googleapis.com/v0/b/tmpage-4a311.appspot.com/o/1-user_documents%2Fezgif.com-gif-maker%20(1).png?alt=media&token=b762fe43-fbce-481b-9157-b81c734d3718 alt="tellz.me® International GmbH" border="0" />'
    
        +'</a> <br />'
        +'</td>'
        +'<td style="padding-left: 20px; padding-right: 20px;" colspan="2"width="150px"align="right">'
        +'<a class="link" href="https://www.tellz.me" target="_blank">' 
        +'<b>EN<br />USER<br />MAIL'
        +'</b>'
        +'</a>'
        +'</td>'
                  
                  
        +'</tr>'

        +'<tr>'
        +'<td height="20px" colspan="4">'
        +'&nbsp;'
        +'</td>'
        +'</tr>'
    
        +'<tr>'
        +'<td colspan="4" style="padding-left: 20px; padding-right: 20px;">'
        +'<h1>'
        +'<br />'
        +'Please confirm your account'
        +'</h1>'
                    
        +'<p class="subtitle">'
        +'We connect the world: online meets offline.'
        +'</p>'
        +'</td>'
        +'<td>'
        +'&nbsp;'
        +'</td>'
        +'</tr>'
        +'<tr>'
        +'<td colspan="4">'
        +'<hr />'
        +'</td>'
        +'</tr>'
    
        +'</tbody>'
        +'</table>'
        +'</td>'
        +'</tr>'
    
        +'<tr>'
        +'<td colspan="2" style="padding: 20px;">'
        +'<table class="deviceWidth" style="width: 100%;" cellspacing="0" cellpadding="0" border="0" align="left">'
        +'<tbody>'
        +'<tr>'
        +'<td>'
              
        +'<p>Hello '+data.name+','
        +'<br /><br />'
        +'Nice that you have chosen tellz.me&#174;. <br /><br />'
        +'<b>How to confirm your account:</b><br />'
        +'Please open the app on your mobile phone now and enter these four digits on the start page: '
        +'</p>'
                  
        +'<h2 class="center">' 
        + data.otp +'</h2>'
                  
        +'<p> If you do not confirm the account, it will be automatically deleted in<br />7 days.'
        +'<br /><br /><a href="https://intercom.help/tellzme/de/" target="_blank">Find out here</a> what the app does and how to use it.'
                     
        +'<br /><br />'
        +'If you have not yet downloaded the app to your phone, use these links or go to the Apple Store or Google Play and enter "tellz.me PAGE" in the search.	<table>'
        +'<br /><br />'
        +'<tr>'
        +'<td>'
                  
        +'<a href="https://play.google.com/store/apps/details?id=com.app.tmpage" target="_blank"> '
        +'<img class="deviceWidth " style="width: 100%!important;" src="https://www.der-business-tipp.de/kampagnen/tellzme/google-app-store-icon-white.png" alt="GooglePlay Download" border="0" />'
        +'</a><br />'
        +'<a href="https://play.google.com/store/apps/details?id=com.app.tmpage" target="_blank">Download Android</a>'
        +'</td>'
        +'<td align="left">'
        +'<a href="https://apps.apple.com/de/app/tellz-me-page/id1622993070" target="_blank">' 
        +'<img class="deviceWidth " style="width: 100%!important;" src="https://www.der-business-tipp.de/kampagnen/tellzme/apple-app-store-icon-white.png" alt="AppleStore Download" border="0" />'
        +'</a><br />'
        +'<a href="https://apps.apple.com/de/app/tellz-me-page/id1622993070" target="_blank">Download IOS</a>' 
                          
        +'</td>'
        +'</tr>'
        +'</table><br /><br />'	
        +'<table>'
        +'<tr>'
        +'<td width="350px">'
        +' If you have any questions or suggestions for us,'
        +'please feel free to send us an email.<br />'
        +' </td>'
        +'<td width="210px">'
        +'<a href="https://www.tellz.me" target="_blank">' 
        +'<img class="deviceWidth " style="width:190px!important;"' 
        +'src="https://firebasestorage.googleapis.com/v0/b/tmpage-4a311.appspot.com/o/1-user_documents%2Fezgif.com-gif-maker%20(2).png?alt=media&token=978a6acd-0021-4e6e-942e-eaad08834fb2"' 
        +'alt="Watch the video" border="0" />'
        +'</a>'
        +'</td>'
        +'</tr>'
        +'<tr>'
        +'<td width="350px">'
        +'<br />'
        +'<br /><br />'
        +'We hope you enjoy the app.<br /><br />'
        +'Kind regards,<br />'
        +'Your tellz.me&#174; service team <br />'
        +'Email: <a href="mailto:support@tellz.me" target="_blank">support@tellz.me</a>'
        +' </td>'
        +' <td>'
                    
        +'<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="left" style="margin: auto">'
        +'<tr>'
        +'<td style="border-radius: 3px; background: #F8F8F8; text-align: center;" class="button-td">'
        +'<a href="https://qr-code.page/" target="_blank" class="button-a">'
        +'>>> Log in now &nbsp;&nbsp;'
        +'</a>'
        +'</td>'
        +'</tr>'
        +'</table>'
        +'<br />'
                    
        +'</td>'
        +'</tr>'
        +'</table>'	                   
        +'</p>'
        +'</td>'
        +'</tr>'
        +'</tbody>'
        +'</table>'
        +'</td>'
        +'</tr>'
        +'<tr>'
        +'<td style="Padding-left:20px; padding-right:20px;">'
        +'<a href="https://tellz.me" target="_blank">'
        +'<img class="deviceWidth " style="width: 100%!important;"' 
        +'src="https://firebasestorage.googleapis.com/v0/b/tmpage-4a311.appspot.com/o/emailsystem%2F6373c1bbee36d363ad68493c_admin_de-p-3200%201.png?alt=media&token=17b3aa29-8e0a-4988-85b2-a066056e0c98" />'
        +'</a>'			
        +'</td>'
        +'</tr>'   
        +'<tr>'
        +'<td colspan="2" style="padding: 20px;">'
        +'<p class="impressum">'
        +'© tellz.me® International GmbH, Hohe Strasse 19, 27374 Visselhövede, Germany,' 
        +'VAT no. DE313991621, Trade register no. HRB 206853, Local court Walsrode, CEO:Timo Bösch,' 
        +'Email:hello@tellz.me'
        +'<br /><br />'
        +'This message was sent to ##emfängeremail## and is intended for ##name##. tellz.me® sends you updates like this to let you know about' 
        +'the latest posts on tellz.me®. You can unsubscribe from updates or remove your email' 
        +'address if this is not your tellz.me® account. ##Unsubscribe here##.'
        +'</p>'	
        +'</td>'
        +'</tr>'
                  
        +'</tbody>'
        +'</table>'
        +'</body>'
        +'</html>'


    intializeMailServeice();

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: companyEmail_OTP, // sender address
      to: data.email, // list of receivers
      subject: "tellz.me® PAGE OTP", // Subject line
      // text: "Hello world?", // plain text body

      html: emailTemplate
    });

    const querySnapshot = await admin.firestore().collection("newlyCreatedUsers")
    .where("uid", "==", data.uid)
    .limit(1)
    .get();

    const now = Date.now(); // current date and time in milliseconds
    const threeDaysLater = new Date(now + (3 * 24 * 60 * 60 * 1000)).getTime();

    if (!querySnapshot.empty) {
       const docRef = querySnapshot.docs[0].ref;
       await docRef.update({ resendVerificationEmailDate: threeDaysLater });
    }
    });
  });
}


function deleteUnVerifiedUsersAfterSevenDays() {

  admin.firestore().collection("newlyCreatedUsers")
  .where("isUserverrified", "==" , false)
  .where("accountDeletionDate", "<=", Date.now())
  .get().then((snapshot) => {
    
    snapshot.forEach(async (element) => {
      const data = element.data();
      try {
        await admin.auth().deleteUser(data.uid);
        await admin.firestore().collection("newlyCreatedUsers").delete(element.id);
        console.log('Successfully deleted user');
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    });
  });
}

//Triggered when isWholeSaler becomes true in Users is created
exports.userUpdated = functions.firestore
  .document("user/{documentId}")
  .onUpdate((change, context) => {
    // Get an object representing the document
    // e.g. {'name': 'Marie', 'age': 66}
    const userAfter = change.after.data();

    // ...or the previous value before this update
    const userBefore = change.before.data();


    if (userBefore.isWholesaler != true && userAfter.isWholesaler == true) {
      const wholesaler = {
        wholesalerId: userAfter.uid,
        createdAt: Date.now(),
        uid: userAfter.uid,
        reatailerId: userAfter.uid,
        email: userAfter.email,

      };
      return admin.firestore()
        .collection("wholesaler")
        .doc(userAfter.uid)
        .set(wholesaler)
        .then((d) => {
          console.log("whaolesaler created" + d);
        });
    }

    // perform desired operations ..
  });


// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
exports.app = functions.https.onRequest(app);






////////////////////EMAIL///////////////////
// Incoming Mail (IMAP) Server
// imap.gmail.com
// Requires SSL: Yes
// Port: 993
// Outgoing Mail (SMTP) Server
// smtp.gmail.com
// Requires SSL: Yes
// Requires TLS: Yes (if available)
// Requires Authentication: Yes
// Port for SSL: 465
// Port for TLS/STARTTLS: 587
// Full Name or Display Name: tellz.me® PAGE
// Account Name, User name, or Email address: otp@qr-code.page
// Password: j6NH1rvA&bYpLKdCL#W&4i06X
// App Pass: "ommevmwxmkpsibqc"

var adminEmailAddress = "retailer@qr-code.page";
var companyEmail_OTP = "otp@qr-code.page";
var companyEmail_Info = "info@qr-code.page";

var host = "smtp.gmail.com";
var port = 587;
var secure = false;
var user = "otp@qr-code.page";
var pass = "ommevmwxmkpsibqc";

"use strict";


function intializeMailServeice() {
  transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: secure, // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass,
    },
  });
}
// ==============SMTP EMAIL================
// email: otp@tellz.me
// pass: 1$,koR9akvohjx
// username: p320642p74
// mail.agenturserver.de


app.post("/sendEmail", async (req, res) => {
  if (req.body.to == null || req.body.otp == null) {
    res.json({ msg: "to and otp required", status: "failure" });
  } else {

    OTP = req.body.otp;
    // console.log(OTP);
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();
    // console.log("1");

    // create reusable transporter object using the default SMTP transport
    // let transporter = nodemailer.createTransport({
    //   host: host,
    //       // host: "smtp.ethereal.email",

    //   port: port,
    //   secure: secure, // true for 465, false for other ports

    //   auth: {
    //     // user: testAccount.user, // generated ethereal user
    //     // pass: testAccount.pass, // generated ethereal password
    //     user: user, 
    //     pass: pass,
    //   },
    // });
    // console.log("2");




    var emailTemplate = '<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">'
      + '<div style="margin:50px auto;width:70%;padding:20px 0">'
      + '<div style="border-bottom:1px solid #eee">'
      + '<a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">tellz.me® PAGE</a></div>'
      + '<p style="font-size:1.1em">Hi,</p>'
      + '<p>Thank you for choosing our Brand. Use the following OTP to complete your Retailer Registration procedures.</p>'
      + '<h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">'
      + req.body.otp + '</h2>'
      + '<p style="font-size:0.9em;">Regards,<br />tellz.me® PAGE</p>'
      + '<hr style="border:none;border-top:1px solid #eee" />'
      + '<div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">'
      + '<p>tellz.me® International GmbH</p>'
      + '<p>High street 19</p>'
      + '<p>27374 Visselhövede</p>'
      + '<p>Managing director: Timo Bösch</p>'
      + '<p>Seat of the company: Visselhövede</p>'
      + '<p>Local court Walsrode, HRB 206853</p>'
      + '</div>'
      + '</div>'
      + '</div>'
    intializeMailServeice();

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: companyEmail_OTP, // sender address
      to: req.body.to, // list of receivers
      subject: "tellz.me® PAGE OTP", // Subject line
      // text: "Hello world?", // plain text body

      html: emailTemplate
    });

    // console.log("3");

    // console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    res.json({ otp: OTP, message: info });
  }
});



app.post("/sendSignUpOTP", async (req, res) => {
  if (req.body.to == null || req.body.otp == null || req.body.username == null) {
    res.json({ msg: "to and otp required", status: "failure" });
  } else {

    OTP = req.body.otp;
    let testAccount = await nodemailer.createTestAccount();

    var emailTemplate = '<html xmlns="http://www.w3.org/1999/xhtml">'
    +'<head>'
    +'<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'
    +'<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">'
    +'<title>Many thanks for your registration</title>'
    +'<style type="text/css">'
    
    +'@font-face {'
    +'font-family: \'Icons Technology Template\';'
    +'src: url(\'https://assets.website-files.com/635006df15081fdeda1bbe4f/635006df15081f62be1bbeed_icons-technology-template.woff2\')format(\'woff2\');'
    +'font-weight: 400;'
    +'font-style: normal;'
    +'font-display: swap;'
    +'}'
    +'@font-face {'
    +'font-family: \'Plus Jakarta Display\';'
    +'src: url(\'https://assets.website-files.com/635006df15081fdeda1bbe4f/635006df15081f3e891bbeb1_PlusJakartaDisplay-Medium.otf\') format(\'opentype\');'
    +'font-weight: 500;'
    +'font-style: normal;'
    +'font-display: swap;'
    +'}'
    +'@font-face {'
    +'font-family: \'Plus Jakarta Display\';'
    +'src: url(\'https://assets.website-files.com/635006df15081fdeda1bbe4f/635006df15081f50301bbecf_PlusJakartaDisplay-Regular.otf\') format(\'opentype\');'
    +'font-weight: 400;'
    +'font-style: normal;'
    +'font-display: swap;'
    +'}'
    
    
    +'.preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; }'
    +'.column {padding-bottom: 20px;}'
    
    +'@font-face {'
    +'font-family: \'Open Sans\', Arial, Helvetica, sans-serif;'
    +'font-style: normal;'
    +'font-weight: 400;'
    +'}'
    
    +'img {display:block;}'
    
    +'p,td, ul, li{'
    +'font-family: \'Open Sans\', Arial, Helvetica, sans-serif;'
    +'color:#00000; line-height: 1.3em; font-size:1.0em;  }'
    
    +'p.subtitle{'
    +'font-family: \'Open Sans\', Arial, Helvetica, sans-serif;'
    +'color:#a0a0a0; line-height: 1.15em; font-size:1.0em;  }'
    
    +'p.impressum{'
    +'font-family: \'Open Sans\', Arial, Helvetica, sans-serif;'
    +'color:#a0a0a0; font-weight:300; line-height: 1.2em; font-size:0.8em;  }'
    
    +'a{'
    +'font-family: \'Open Sans\', Arial, Helvetica, sans-serif; font-weight:normal;   font-size:1em;   margin-top:20px; text-decoration:underline; color:#0144e4;}'
    
    +'a.weiterlesen{font-family: \'Open Sans\', Arial, Helvetica, sans-serif;    font-size:1.05em;     font-weight:bold;     text-decoration:underline;    color:#0144e4;   }'
    
    +'a.headline{font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  font-weight:bold;   line-height:1.2em;  text-decoration:none;  color:#0144e4;  font-size: 1.2em;  padding-bottom:1em; }'
    
    +'h1{  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  font-weight:bold;   line-height:1.2em;  text-align:middle;  color:#000000;   font-size: 1.4em;}'
    
    +'h2{  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  font-weight:bold;   font-size: 1.3em;  line-height:1.2em;  text-align:middle;  color:#0144e4;  }'
    
    +'h3{  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  font-weight:bold;   line-height:1.3em;  text-align:middle;  color:#0144e4;   font-size: 1.3em;}'
    
    +'hr {border-top: 1px;color: #e7e7e7;}'
    
    +'tr.grey{background-color: #f2f2f2;border: 1px;border-color: #000000; }'
    
    +'a.link {  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  font-size: 0.9em;   font-weight: normal;  color:#0144e4;  line-height: 1.1;   text-decoration: none;   }'
    
    
    +'a.link:hover { text-decoration: underline;   }'
    
    
    +'a.button-a {  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  background: #0144e4;   border: 15px solid #0144e4;   font-size: 1em;   font-weight: bold;  color:#FFFFFF;  line-height: 1.1;   text-align: center;   text-decoration: none;   display: block; border-radius: 3px;  }'
    
    
    +'a.button-a:hover {  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  font-size: 1em;   font-weight: bold;  color:#0144e4;   background: #2E9AFE !important;  border-color: #2E9AFE !important;  }'
    
    +'a.button-b {  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  background: #cccccc;   border: 15px solid #cccccc;   font-size: 1em;   font-weight: bold;  color:#FFFFFF;  line-height: 0.9;   text-align: center;   text-decoration: none;   display: block; border-radius: 3px; }'
    
    
    +'a.button-b:hover {  font-family: \'Open Sans\', Arial, Helvetica, sans-serif;  font-family:arial,verdana,helvetica;  font-size: 0.95em;   font-weight: bold;  color:#FFFFFF;     background: #999999 !important; border-color: #999999 !important;}'
      
    +'@media only screen and (max-width: 640px) {'
    +'.deviceWidth {'
    +'padding: 0;'
    +' }'

    +'.center {text-align: center!important;width: 100%;}'
    +'}'
    
    +'@media only screen and (max-width: 479px) {'
    +'.deviceWidth {'
    +'width: 280px!important;'
    +'padding: 0;'
    +'}'
    +'}'
    
        +'</style>'
        +'</head>'
        +'<body style="margin-top:10px;" bgcolor="#F8F8F8" leftmargin="0" topmargin="100px" marginwidth="0" marginheight="0">'
        +'<span class="preheader" style="display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;"> '
        +'Please confirm your identity</span>'
        +'<table style="width: 100%;" cellspacing="0" cellpadding="0" border="0" bgcolor="#F8F8F8">'
        +'<tbody>'
        +'<tr>'
        +'<td align="center">'
    
        +'<table class="deviceWidth" style="width: 600px;" cellspacing="0" cellpadding="0" border="0" bgcolor="#F8F8F8">'
        +' <tbody>'
        +'<tr>'
        +'<td colspan="2">'
        +'<table style="width: 100%;">'
        +'<tbody>'
        +'<tr>'
        +'<td height="20px" colspan="4">'
        +'&nbsp;'
        +'</td>'
        +'</tr>'
    
        +'<tr>'
        +'<td style="Padding-left:5px; padding-right:20px;" width="100px" align="left">'
        +'<a href="https://www.tellz.me" target="_blank">'
        +'<img class="deviceWidth " style="width: 100px!important;"'
        +'src="https://firebasestorage.googleapis.com/v0/b/tmpage-4a311.appspot.com/o/1-user_documents%2Fezgif.com-gif-maker.png?alt=media&token=d399ee57-f417-4e76-b3cb-ee30bb8b301b"/>'
        +'</a>'			
        +'</td>'
        +'<td width="450px" colspan="3">'
        +'</td>'
                  
        +'</tr>'

        +'<tr>'
        +'<td height="40px" colspan="4">'
        +'&nbsp;'
        +'</td>'
        +'</tr>'
 
        +'<tr>'
        +'<td colspan="2"style="padding-left: 20px; padding-right: 20px;background: #F8F8F8F8;" width="300px">'
        +'<a href="https://www.tellz.me" target="_blank">' 
                    
        +'<img class="deviceWidth " style="width: 180px!important;"' 
        +'src="https://firebasestorage.googleapis.com/v0/b/tmpage-4a311.appspot.com/o/1-user_documents%2Fezgif.com-gif-maker%20(1).png?alt=media&token=b762fe43-fbce-481b-9157-b81c734d3718 alt="tellz.me® International GmbH" border="0" />'
    
        +'</a> <br />'
        +'</td>'
        +'<td style="padding-left: 20px; padding-right: 20px;" colspan="2"width="150px"align="right">'
        +'<a class="link" href="https://www.tellz.me" target="_blank">' 
        +'<b>EN<br />USER<br />MAIL'
        +'</b>'
        +'</a>'
        +'</td>'
                  
                  
        +'</tr>'

        +'<tr>'
        +'<td height="20px" colspan="4">'
        +'&nbsp;'
        +'</td>'
        +'</tr>'
    
        +'<tr>'
        +'<td colspan="4" style="padding-left: 20px; padding-right: 20px;">'
        +'<h1>'
        +'<br />'
        +'Please confirm your account'
        +'</h1>'
                    
        +'<p class="subtitle">'
        +'We connect the world: online meets offline.'
        +'</p>'
        +'</td>'
        +'<td>'
        +'&nbsp;'
        +'</td>'
        +'</tr>'
        +'<tr>'
        +'<td colspan="4">'
        +'<hr />'
        +'</td>'
        +'</tr>'
    
        +'</tbody>'
        +'</table>'
        +'</td>'
        +'</tr>'
    
        +'<tr>'
        +'<td colspan="2" style="padding: 20px;">'
        +'<table class="deviceWidth" style="width: 100%;" cellspacing="0" cellpadding="0" border="0" align="left">'
        +'<tbody>'
        +'<tr>'
        +'<td>'
              
        +'<p>Hello '+req.body.username+','
        +'<br /><br />'
        +'Nice that you have chosen tellz.me&#174;. <br /><br />'
        +'<b>How to confirm your account:</b><br />'
        +'Please open the app on your mobile phone now and enter these four digits on the start page: '
        +'</p>'
                  
        +'<h2 class="center">' 
        + req.body.otp +'</h2>'
                  
        +'<p> If you do not confirm the account, it will be automatically deleted in<br />7 days.'
        +'<br /><br /><a href="https://intercom.help/tellzme/de/" target="_blank">Find out here</a> what the app does and how to use it.'
                     
        +'<br /><br />'
        +'If you have not yet downloaded the app to your phone, use these links or go to the Apple Store or Google Play and enter "tellz.me PAGE" in the search.	<table>'
        +'<br /><br />'
        +'<tr>'
        +'<td>'
                  
        +'<a href="https://play.google.com/store/apps/details?id=com.app.tmpage" target="_blank"> '
        +'<img class="deviceWidth " style="width: 100%!important;" src="https://www.der-business-tipp.de/kampagnen/tellzme/google-app-store-icon-white.png" alt="GooglePlay Download" border="0" />'
        +'</a><br />'
        +'<a href="https://play.google.com/store/apps/details?id=com.app.tmpage" target="_blank">Download Android</a>'
        +'</td>'
        +'<td align="left">'
        +'<a href="https://apps.apple.com/de/app/tellz-me-page/id1622993070" target="_blank">' 
        +'<img class="deviceWidth " style="width: 100%!important;" src="https://www.der-business-tipp.de/kampagnen/tellzme/apple-app-store-icon-white.png" alt="AppleStore Download" border="0" />'
        +'</a><br />'
        +'<a href="https://apps.apple.com/de/app/tellz-me-page/id1622993070" target="_blank">Download IOS</a>' 
                          
        +'</td>'
        +'</tr>'
        +'</table><br /><br />'	
        +'<table>'
        +'<tr>'
        +'<td width="350px">'
        +' If you have any questions or suggestions for us,'
        +'please feel free to send us an email.<br />'
        +' </td>'
        +'<td width="210px">'
        +'<a href="https://www.tellz.me" target="_blank">' 
        +'<img class="deviceWidth " style="width:190px!important;"' 
        +'src="https://firebasestorage.googleapis.com/v0/b/tmpage-4a311.appspot.com/o/1-user_documents%2Fezgif.com-gif-maker%20(2).png?alt=media&token=978a6acd-0021-4e6e-942e-eaad08834fb2"' 
        +'alt="Watch the video" border="0" />'
        +'</a>'
        +'</td>'
        +'</tr>'
        +'<tr>'
        +'<td width="350px">'
        +'<br />'
        +'<br /><br />'
        +'We hope you enjoy the app.<br /><br />'
        +'Kind regards,<br />'
        +'Your tellz.me&#174; service team <br />'
        +'Email: <a href="mailto:support@tellz.me" target="_blank">support@tellz.me</a>'
        +' </td>'
        +' <td>'
                    
        +'<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="left" style="margin: auto">'
        +'<tr>'
        +'<td style="border-radius: 3px; background: #F8F8F8; text-align: center;" class="button-td">'
        +'<a href="https://qr-code.page/" target="_blank" class="button-a">'
        +'>>> Log in now &nbsp;&nbsp;'
        +'</a>'
        +'</td>'
        +'</tr>'
        +'</table>'
        +'<br />'
                    
        +'</td>'
        +'</tr>'
        +'</table>'	                   
        +'</p>'
        +'</td>'
        +'</tr>'
        +'</tbody>'
        +'</table>'
        +'</td>'
        +'</tr>'
        +'<tr>'
        +'<td style="Padding-left:20px; padding-right:20px;">'
        +'<a href="https://tellz.me" target="_blank">'
        +'<img class="deviceWidth " style="width: 100%!important;"' 
        +'src="https://firebasestorage.googleapis.com/v0/b/tmpage-4a311.appspot.com/o/emailsystem%2F6373c1bbee36d363ad68493c_admin_de-p-3200%201.png?alt=media&token=17b3aa29-8e0a-4988-85b2-a066056e0c98" />'
        +'</a>'			
        +'</td>'
        +'</tr>'   
        +'<tr>'
        +'<td colspan="2" style="padding: 20px;">'
        +'<p class="impressum">'
        +'© tellz.me® International GmbH, Hohe Strasse 19, 27374 Visselhövede, Germany,' 
        +'VAT no. DE313991621, Trade register no. HRB 206853, Local court Walsrode, CEO:Timo Bösch,' 
        +'Email:hello@tellz.me'
        +'<br /><br />'
        +'This message was sent to ##emfängeremail## and is intended for ##name##. tellz.me® sends you updates like this to let you know about' 
        +'the latest posts on tellz.me®. You can unsubscribe from updates or remove your email' 
        +'address if this is not your tellz.me® account. ##Unsubscribe here##.'
        +'</p>'	
        +'</td>'
        +'</tr>'
                  
        +'</tbody>'
        +'</table>'
        +'</body>'
        +'</html>'




    intializeMailServeice();

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: companyEmail_OTP, // sender address
      to: req.body.to, // list of receivers
      subject: "tellz.me® PAGE OTP", // Subject line
      // text: "Hello world?", // plain text body

      html: emailTemplate
    });
    res.json({ otp: OTP, message: info });
  }
});
//////

function sendWholesalerQualifiedEmail(wholesalerEmail, callback) {
  // create reusable transporter object using the default SMTP transport
  // let transporter = nodemailer.createTransport({
  //   host: host,
  //   port: port,
  //   secure: secure, // true for 465, false for other ports
  //   auth: {
  //     user: user, 
  //     pass: pass,
  //   },
  // });

  intializeMailServeice();
  // send mail with defined transport object
  transporter.sendMail({
    from: companyEmail_Info, // sender address
    to: wholesalerEmail, // list of receivers
    subject: "Congradulation!", // Subject line
    text: "Congradulations, You have qualified for the Wholesaler status. Now please wait till company member contacts you.", // plain text body

    // html: emailTemplate
  });

  transporter.sendMail({
    from: companyEmail_Info, // sender address
    to: adminEmailAddress, // list of receivers
    subject: "Alert!", // Subject line
    text: "A new retailer has qualified for the Wholesaler " + wholesalerEmail, // plain text body

    // html: emailTemplate
  });

}