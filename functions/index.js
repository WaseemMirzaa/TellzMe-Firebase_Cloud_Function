const functions = require("firebase-functions");
const express = require("express");
const app = express();
const admin = require("firebase-admin");
const uuid = require('uuid');
admin.initializeApp();

const uAmount = 20;
const isRedeemedFlag = false;
const isApplicableFlag = false;

const Stripe = require("stripe");
const stripe = Stripe(
  "sk_test_51IK0ryFiEatvCdLGJDpWhMGhMRxRDbhoB9mOFXZpC88Pg6a7JAI1b1kJp1H9PrXQS7yOF8z5xzIx5H6z1m0mvCYM00A85BW07i"
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
            body: req.body.msg,
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


var adminEmailAddress = "sibghat.developlogix@gmail.com";
var companyEmail = "otp@tellz.me";

var host = "mail.agenturserver.de";
var port = 587;
var secure = false;
var user = "p320642p74";
var pass = "1$,koR9akvohjx";

"use strict";
const nodemailer = require("nodemailer");

let transporter = null;

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
      + '<a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Tellz.me</a></div>'
      + '<p style="font-size:1.1em">Hi,</p>'
      + '<p>Thank you for choosing our Brand. Use the following OTP to complete your Retailer Registration procedures.</p>'
      + '<h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">'
      + req.body.otp + '</h2>'
      + '<p style="font-size:0.9em;">Regards,<br />Tellz.me</p>'
      + '<hr style="border:none;border-top:1px solid #eee" />'
      + '<div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">'
      + '<p>Tellz.me</p>'
      + '</div>'
      + '</div>'
      + '</div>'
    intializeMailServeice();

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: companyEmail, // sender address
      to: req.body.to, // list of receivers
      subject: "Tellz.me OTP", // Subject line
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
    from: companyEmail, // sender address
    to: wholesalerEmail, // list of receivers
    subject: "Congradulation!", // Subject line
    text: "Congradulations, You have qualified for the Wholesaler status. Now please wait till company member contacts you.", // plain text body

    // html: emailTemplate
  });

  transporter.sendMail({
    from: companyEmail, // sender address
    to: adminEmailAddress, // list of receivers
    subject: "Alert!", // Subject line
    text: "A new retailer has qualified for the Wholesaler " + wholesalerEmail, // plain text body

    // html: emailTemplate
  });

}


