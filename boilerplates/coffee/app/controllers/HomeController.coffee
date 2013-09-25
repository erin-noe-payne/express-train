module.exports = -> 
	controller = 
		index: (req, res, next) -> 
			res.render "index"


# module.exports = function () {
#     return {

#         // Landing

#         index:[
#             function (req, res, next) {
#                 res.render('index');
#             }]

#     };
# };
