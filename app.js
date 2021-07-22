var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var express = require("express");
const { v4: uuidv4 } = require("uuid");
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
express.static("public");

var user_base_schema = new mongoose.Schema({
	unique_id: String,
	alone: Boolean,
	room: String,
});

var user_base = mongoose.model("user_bases", user_base_schema);

mongoose.connect(
	"mongodb+srv://wimpywarlord:warlord123@cluster0.0m95r.mongodb.net/<dbname>?retryWrites=true&w=majority",
	{ dbName: "viit" },
	function (err, res) {
		if (err) {
			console.log("mongo lab server not connected");
			console.log(err);
		} else {
			console.log("CONNECTED TO DB");
		}
	}
);

app.get("/", function (req, res) {
	res.render("index.ejs");
});

app.post("/party", async function (req, res) {
	var sort = { _id: 1 };
	var list_of_all_user;
	console.log("FETCHING STARTED.");
	var best_free_room;

	var list_of_all_user = await user_base
		.find({}, function (err, all_users) {
			return new Promise((resolve, reject) => {
				if (err) {
					console.log("ALL CURRENT USER NOT FETCHED");
					reject(err);
				} else {
					console.log("ALL USERS FETCHED.");
					// console.log(all_users);
					list_of_all_user = all_users;
					resolve(all_users);
				}
			});
		})
		.sort(sort);
	console.log("FETCHING COMPLETED.");

	// console.log(list_of_all_user);
	// <--CODE FOR FINDING THE BEST ROOM-->
	console.log("STARTING TO FIND BEST ROOM");
	if (list_of_all_user != undefined)
		list_of_all_user.forEach((element) => {
			if (element.alone == true) {
				best_free_room = element;
				return false;
			}
		});
	if (!best_free_room) {
		console.log("NO BEST USER FOUNDS");
	} else {
		console.log(best_free_room);
	}
	console.log("END OF BEST ROOM");

	// <--CODE FOR FINDING THE BEST ROOM-->

	if (best_free_room) {
		// console.log("THE BEST USESR IS", best_free_room);
		var filter = { unique_id: best_free_room.unique_id };
		var update = { alone: false };
		// SETTING THE ALONE OF BEST USER TO FALSE

		var updating_one_person = new Promise(async (resolve, reject) => {
			console.log("STARTING UPDATE USER WHO GOT PAIRED NOW");
			await updateDb(filter, update, false);
			console.log("ENDING UPDATE USER WHO GOT PAIRED NOW");
		});
		console.log("late ENDING UPDATE USER WHO GOT PAIRED NOW");
		// IF WE FIND SOME FREE ROOM

		console.log("STARTING UPDATE OF THE REQUESTING USERS");
		await updateDb(
			{
				unique_id: req.body.unique_id,
			},
			{
				unique_id: req.body.unique_id,
				alone: false,
				room: best_free_room.room,
			},
			{
				upsert: true,
			}
		);
		console.log("ENDING UPDATE OF THE REQUESTING USERS");
		res.redirect(`https://meet.jit.si/${best_free_room.room}`);
	} else {
		// IF NO FREE ROOM IS AVAILABLE
		const room_for_current_user = uuidv4();

		console.log("STARTING CREATE NEW USER");
		await updateDb(
			{
				unique_id: req.body.unique_id,
			},
			{
				unique_id: req.body.unique_id,
				alone: true,
				room: room_for_current_user,
			},
			{
				upsert: true,
			}
		);

		console.log("ENDING CREATE NEW USER");
		res.redirect(`https://meet.jit.si/${room_for_current_user}`);
	}

	// var finding_free_person = new Promise(async (resolve, reject) => { });
	// var finding_free_person = new Promise(async (resolve, reject) => { });
	// var finding_free_person = new Promise(async (resolve, reject) => { });

	// console.log("FETCHING COMPLETED ");

	// res.redirect("/");
});

app.listen(process.env.PORT || 3000, function () {
	console.log("SERVER 3000 HAS STARTED");
});

async function updateDb(filter, update, upsert) {
	return new Promise(async (resolve, reject) => {
		await user_base.findOneAndUpdate(
			filter,
			update,
			{
				upsert: upsert,
			},
			function (err, res) {
				if (err) {
					console.log(err);
					reject(err);
				} else {
					console.log("Done! " + res);
					resolve(res);
				}
			}
		);
	});
}
