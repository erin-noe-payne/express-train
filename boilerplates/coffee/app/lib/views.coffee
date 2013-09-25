hbs = require "express-hbs"
path = require "path"

module.exports = (app) ->
	hbsConfig = 
		partialsDir: path.join __dirname, "../views/partials"

	app.set "view engine", "hbs"
	app.engine "hbs", hbs.express3 hbsConfig