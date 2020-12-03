const express = require("express");
const app = express();

const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");

app.use(cors());
app.use(morgan("combined"));
app.use(bodyParser.raw({ type: "*/*" }));

app.get("/sourcecode", (req, res) => {
  res.send(
    require("fs")
      .readFileSync(__filename)
      .toString()
  );
});

let passwords = new Map();
let tokens = new Map();
// let listingUser = new Map();
// let listingDescription = new Map();
// let listingPrice = new Map();

//listing
let listing = [];

//add-to-cart
let itemCounter = 0;
let cart = [];

//checkout
let purchased = [];

//unique token
let counter = 23;
let genToken = () => {
  counter = counter + 1;
  return "some-unique-token-" + counter + "l4";
};

//unique listingId
let counterListingId = 0;
let genListingId = () => {
  counterListingId = counterListingId + 1;
  return "xyz" + counterListingId;
};

//chat
let chat = [];

app.post("/signup", (req, res) => {
  let parsedBody = JSON.parse(req.body);

  if (!parsedBody.password) {
    res.send(
      JSON.stringify({ success: false, reason: "password field missing" })
    );
    return;
  }
  if (!parsedBody.username) {
    res.send(
      JSON.stringify({ success: false, reason: "username field missing" })
    );
    return;
  }
  if (passwords.has(parsedBody.username)) {
    res.send(JSON.stringify({ success: false, reason: "Username exists" }));
    return;
  }
  passwords.set(parsedBody.username, parsedBody.password);
  res.send(JSON.stringify({ success: true }));
});

app.post("/login", (req, res) => {
  let parsedBody = JSON.parse(req.body);
  let usr = parsedBody.username;
  let actualPassword = parsedBody.password;
  let expectPassword = passwords.get(usr);
  let token = genToken();

  // If the password property is missing from the request body
  if (!actualPassword) {
    res.send(
      JSON.stringify({ success: false, reason: "password field missing" })
    );
    return;
  }
  // If the username is missing
  if (!parsedBody.username) {
    res.send(
      JSON.stringify({ success: false, reason: "username field missing" })
    );
    return;
  }
  // If the username doesn't exist
  if (!passwords.has(usr)) {
    res.send(JSON.stringify({ success: false, reason: "User does not exist" }));
    return;
  }
  // If the password is incorrect
  if (actualPassword !== expectPassword) {
    res.send(JSON.stringify({ success: false, reason: "Invalid password" }));
    return;
  }
  // If a user has signed up with that username and password
  tokens.set(token, parsedBody.username);
  res.send(JSON.stringify({ success: true, token: token }));
});

app.post("/change-password", (req, res) => {
  let parsedBody = JSON.parse(req.body);

  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }
  //If the value of the oldPassword is invalid
  let usr = tokens.get(req.header("token"));
  if (passwords.get(usr) !== parsedBody.oldPassword) {
    res.send(
      JSON.stringify({ success: false, reason: "Unable to authenticate" })
    );
    return;
  }
  //Change password
  passwords.delete(usr, parsedBody.oldPassword);
  passwords.set(usr, parsedBody.newPassword);
  res.send(JSON.stringify({ success: true }));
});

app.post("/create-listing", (req, res) => {
  let parsedBody = JSON.parse(req.body);

  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the price is missing
  if (!parsedBody.price) {
    res.send(JSON.stringify({ success: false, reason: "price field missing" }));
    return;
  }
  //If the description is missing
  if (!parsedBody.description) {
    res.send(
      JSON.stringify({ success: false, reason: "description field missing" })
    );
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  let listingId = genListingId();
  let usr = tokens.get(req.header("token"));

  let list = {
    price: parsedBody.price,
    description: parsedBody.description,
    itemId: listingId,
    sellerUsername: usr
  };
  listing.push(list);

  // listingUser.set(listingId, usr);
  // listingDescription.set(listingId, parsedBody.description);
  // listingPrice.set(listingId, parsedBody.price);
  res.send(JSON.stringify({ success: true, listingId: listingId }));
});

app.get("/listing", (req, res) => {
  let listingId = req.query.listingId;

  //If the value of the listingId query parameter is not a valid listing id
  let itemExist = 0;
  for (const item of listing) {
    if (item.itemId === listingId) {
      itemExist = itemExist + 1;
    }
  }
  if (itemExist === 0) {
    res.send(JSON.stringify({ success: false, reason: "Invalid listing id" }));
    return;
  }

  let fullListing = {};
  for (const item of listing) {
    if (item.itemId === listingId) {
      fullListing = item;
    }
  }

  res.send(JSON.stringify({ success: true, listing: fullListing }));
});

app.post("/modify-listing", (req, res) => {
  let parsedBody = JSON.parse(req.body);
  let itemid = parsedBody.itemid;

  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the itemid is missing
  if (!parsedBody.itemid) {
    res.send(
      JSON.stringify({ success: false, reason: "itemid field missing" })
    );
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  //price and/or description of the listing will get modified
  if (!parsedBody.description) {
    listing.forEach(function(list) {
      if (list.itemId === itemid) {
        list.price = parsedBody.price;
      }
    });
  }
  if (!parsedBody.price) {
    listing.forEach(function(list) {
      if (list.itemId === itemid) {
        list.description = parsedBody.description;
      }
    });
  }

  res.send(JSON.stringify({ success: true }));
});

app.post("/add-to-cart", (req, res) => {
  let parsedBody = JSON.parse(req.body);
  let item = parsedBody.itemid;

  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the itemid is missing
  if (!parsedBody.itemid) {
    res.send(
      JSON.stringify({ success: false, reason: "itemid field missing" })
    );
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }
  //If the itemid is invalid
  let itemExist = 0;
  for (const item of listing) {
    if (item.itemId === parsedBody.itemid) {
      itemExist = itemExist + 1;
    }
  }
  if (itemExist === 0) {
    res.send(JSON.stringify({ success: false, reason: "Item not found" }));
    return;
  }

  // add-to-cart let cart = []
  let addToCart = {
    itemId: parsedBody.itemid,
    sellerUsername: tokens.get(req.header("token"))
  };
  cart.push(addToCart);

  res.send(JSON.stringify({ success: true }));
});

app.get("/cart", (req, res) => {
  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  //get cart
  let arrItem = [];
  let arrCart = [];

  for (const item of cart) {
    if (item.sellerUsername === tokens.get(req.header("token"))) {
      arrItem.push(item.itemId);
    }
  }

  for (let i = 0; i < arrItem.length; i++) {
    for (const item of listing) {
      if (arrItem[i] === item.itemId) {
        arrCart.push(item);
      }
    }
  }

  res.send(JSON.stringify({ success: true, cart: arrCart }));
});

app.post("/checkout", (req, res) => {
  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  //get cart
  let arrItem = [];
  let arrCart = [];

  for (const item of cart) {
    if (item.sellerUsername === tokens.get(req.header("token"))) {
      arrItem.push(item.itemId);
    }
  }

  //If one of the items in the cart has already been purchased
  for (let i = 0; i < arrItem.length; i++) {
    for (const item of purchased) {
      if (item.itemId === arrItem[i]) {
        res.send(
          JSON.stringify({
            success: false,
            reason: "Item in cart no longer available"
          })
        );
      }
    }
  }

  //If the cart is empty
  if (arrItem.length === 0) {
    res.send(JSON.stringify({ success: false, reason: "Empty cart" }));
    return;
  }

  //purchase
  for (const item of cart) {
    if (item.sellerUsername === tokens.get(req.header("token"))) {
      let purchasedBy = {
        itemId: item.itemId,
        sellerUsername: tokens.get(req.header("token"))
      };
      purchased.push(purchasedBy);
    }
  }

  res.send(JSON.stringify({ success: true }));
});

app.get("/purchase-history", (req, res) => {
  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  //items purchased by user
  let purchasedItem = [];
  for (const item of purchased) {
    if (item.sellerUsername === tokens.get(req.header("token"))) {
      purchasedItem.push(item.itemId);
    }
  }

  let purchasedList = [];
  for (let i = 0; i < purchasedItem.length; i++) {
    for (const item of listing) {
      if (item.itemId === purchasedItem[i]) {
        let list = {
          price: item.price,
          description: item.description,
          itemId: item.itemId,
          sellerUsername: item.sellerUsername
        };
        purchasedList.push(list);
      }
    }
  }

  res.send(JSON.stringify({ success: true, purchased: purchasedList }));
});

app.post("/chat", (req, res) => {
  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  let parsedBody = JSON.parse(req.body);

  //If the destination property is missing
  if (!parsedBody.destination) {
    res.send(
      JSON.stringify({ success: false, reason: "destination field missing" })
    );
    return;
  }
  //If the contents property is missing
  if (!parsedBody.contents) {
    res.send(
      JSON.stringify({ success: false, reason: "contents field missing" })
    );
    return;
  }
  //If no user has the recipient's username
  if (!passwords.has(parsedBody.destination)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Destination user does not exist"
      })
    );
    return;
  }

  chat.push({
    from: tokens.get(req.header("token")),
    destination: parsedBody.destination,
    contents: parsedBody.contents
  });

  res.send(JSON.stringify({ success: true }));
});

app.post("/chat-messages", (req, res) => {
  //If the token header is missing
  if (!req.header("token")) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }
  //If the token is invalid
  if (!tokens.has(req.header("token"))) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  let parsedBody = JSON.parse(req.body);

  //If the destination property is missing
  if (!parsedBody.destination) {
    res.send(
      JSON.stringify({ success: false, reason: "destination field missing" })
    );
    return;
  }

  //If no account was created with the recipient username
  if (!passwords.has(parsedBody.destination)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Destination user not found"
      })
    );
    return;
  }

  let chatList = [];
  for (const item of chat) {
    if (item.destination === parsedBody.destination) {
      let chatLi = {
        from: item.from,
        contents: item.contents
      };
      chatList.push(chatLi);
    }

    if (item.from === parsedBody.destination) {
      let chatLi2 = {
        from: item.from,
        contents: item.contents
      };
      chatList.push(chatLi2);
    }
  }

  res.send(JSON.stringify({ success: true, messages: chatList }));
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})

// listen for requests :)
app.listen(process.env.PORT || 3000)