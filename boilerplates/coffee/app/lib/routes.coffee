module.exports = (app, middleware, HomeController) ->
	app.get "/", HomeController.index
