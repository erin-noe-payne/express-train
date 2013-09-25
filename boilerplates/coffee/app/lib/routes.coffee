module.exports = (app, HomeController) ->
	app.get "/", HomeController.index
